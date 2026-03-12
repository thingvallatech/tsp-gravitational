# Phase 1: Foundation + Surface - Research

**Researched:** 2026-03-12
**Domain:** City generation, seeded PRNG, gravitational surface computation, Zustand state management
**Confidence:** HIGH

## Summary

Phase 1 establishes the data layer: TypeScript types, seeded city generation with 6 preset patterns, isolation-weighted gravitational surface computation, and a Zustand store to hold it all. No rendering happens in this phase -- the output is pure data structures ready for Phase 2's visualization layer.

The core technologies are well-understood: Zustand 5 for state, a hand-rolled mulberry32 PRNG for seed reproducibility (no library needed), and straightforward numerical computation for the height field using Float32Array. The gravitational surface formula is custom math -- no library exists for it -- but the computation is simple nested loops over a grid evaluating `h(x,y) = alpha * dist(center) - sum(wi * G(dist(cityi)))`.

**Primary recommendation:** Keep this phase pure TypeScript with zero rendering dependencies. Every function should be unit-testable without a browser. The Zustand store should use the slices pattern to separate city state from surface state.

## Standard Stack

### Core (Phase 1 only)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand | 5.0.11 | Global state for cities + surface data | pmndrs ecosystem, fine-grained selectors, works outside React (Web Workers), minimal API |
| TypeScript | 5.7 | Type safety for data structures | Stable release, avoid 6.0 RC |
| Next.js | 16.1 | Project scaffold with `output: 'export'` | Static SPA export, App Router, Turbopack dev |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | Seeded PRNG | Hand-roll mulberry32 -- 10 lines of code, no dependency needed |
| (none) | - | Surface computation | Custom formula, no library exists |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled mulberry32 | `rand-seed` npm package | Adds a dependency for 10 lines of code. Only use if you need multiple PRNG algorithms (sfc32, xoshiro128) |
| Hand-rolled mulberry32 | `seedrandom` npm package | More popular but larger. Overkill for this use case |
| Zustand slices | Single flat store | Slices separate concerns (cities vs surface vs future algorithm results). Worth the small type complexity |

**Installation (Phase 1 scaffold):**
```bash
# Core framework
npm install next@latest react@latest react-dom@latest

# State management
npm install zustand

# Dev dependencies
npm install -D typescript @types/react @types/react-dom eslint prettier

# Styling (scaffold now, use later)
npm install tailwindcss @tailwindcss/postcss
```

## Architecture Patterns

### Recommended Project Structure (Phase 1 scope)

```
src/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main page (placeholder UI for Phase 1)
│   └── globals.css          # Tailwind imports
├── lib/
│   ├── types.ts             # Core data types (City, SurfaceParams, etc.)
│   ├── prng.ts              # Seeded PRNG (mulberry32)
│   ├── city-generator.ts    # Preset generators (random, clustered, etc.)
│   ├── surface.ts           # Gravitational surface computation
│   └── math-utils.ts        # Distance, normalization helpers
├── store/
│   ├── index.ts             # Combined store export
│   ├── city-slice.ts        # City state + actions
│   └── surface-slice.ts     # Surface state + computed height field
└── __tests__/
    ├── prng.test.ts          # Seed determinism tests
    ├── city-generator.test.ts # Preset shape tests
    └── surface.test.ts       # Height field computation tests
```

### Pattern 1: Seeded PRNG with Mulberry32

**What:** A deterministic pseudo-random number generator seeded with an integer. Same seed always produces the same sequence.
**When to use:** Every call to Math.random()-like behavior in city generation.
**Example:**
```typescript
// Source: mulberry32 algorithm (public domain, widely documented)
export function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Usage:
const rng = mulberry32(42);
const x = rng(); // Always 0.6011037519201636 for seed 42
const y = rng(); // Always the same second value
```

**Key property:** The RNG is a closure. Create one per city generation call. Pass it to all functions that need randomness -- never use `Math.random()`.

### Pattern 2: Zustand Slices with TypeScript

**What:** Separate store concerns into typed slices that compose into one store.
**When to use:** When the store has distinct domains (cities, surface, future: algorithms).
**Example:**
```typescript
// Source: Zustand v5 documentation, slices pattern
import { create, StateCreator } from 'zustand';

// --- Types ---
interface CitySlice {
  cities: City[];
  preset: PresetName;
  seed: number;
  setCities: (preset: PresetName, seed: number) => void;
}

interface SurfaceSlice {
  heightField: Float32Array | null;
  surfaceParams: SurfaceParams;
  recomputeSurface: () => void;
  setSurfaceParams: (params: Partial<SurfaceParams>) => void;
}

type StoreState = CitySlice & SurfaceSlice;

// --- Slices ---
const createCitySlice: StateCreator<StoreState, [], [], CitySlice> =
  (set) => ({
    cities: [],
    preset: 'random',
    seed: 1,
    setCities: (preset, seed) => {
      const cities = generateCities(preset, seed);
      set({ cities, preset, seed });
    },
  });

const createSurfaceSlice: StateCreator<StoreState, [], [], SurfaceSlice> =
  (set, get) => ({
    heightField: null,
    surfaceParams: { kernelWidth: 0.15, liftAlpha: 1.0, gridResolution: 128 },
    recomputeSurface: () => {
      const { cities, surfaceParams } = get();
      const heightField = computeHeightField(cities, surfaceParams);
      set({ heightField });
    },
    setSurfaceParams: (params) => {
      set((state) => ({
        surfaceParams: { ...state.surfaceParams, ...params },
      }));
    },
  });

// --- Combined Store ---
export const useStore = create<StoreState>()((...a) => ({
  ...createCitySlice(...a),
  ...createSurfaceSlice(...a),
}));
```

### Pattern 3: Height Field as Flat Float32Array

**What:** Store the gravitational surface as a flat `Float32Array` indexed by `y * gridSize + x`.
**When to use:** For the computed surface data that feeds into both 3D mesh vertex displacement and 2D heatmap rendering.
**Why Float32Array:** Contiguous memory, 4 bytes per value (vs 8 for Float64/Number), directly transferable to Web Workers via `postMessage` (transferable), directly usable as Three.js BufferAttribute data.
**Example:**
```typescript
export function computeHeightField(
  cities: City[],
  params: SurfaceParams
): Float32Array {
  const { gridResolution, kernelWidth, liftAlpha } = params;
  const size = gridResolution * gridResolution;
  const field = new Float32Array(size);

  // Pre-compute isolation weights (distance to nearest neighbor)
  const weights = computeIsolationWeights(cities);

  // Center point of all cities
  const cx = cities.reduce((s, c) => s + c.x, 0) / cities.length;
  const cy = cities.reduce((s, c) => s + c.y, 0) / cities.length;

  for (let gy = 0; gy < gridResolution; gy++) {
    for (let gx = 0; gx < gridResolution; gx++) {
      // Map grid coords to world coords [0, 1]
      const wx = gx / (gridResolution - 1);
      const wy = gy / (gridResolution - 1);

      // Lift term: distance from centerpoint
      const distCenter = Math.sqrt((wx - cx) ** 2 + (wy - cy) ** 2);
      let h = liftAlpha * distCenter;

      // Gravitational wells: weighted sum of kernels at each city
      for (let i = 0; i < cities.length; i++) {
        const dx = wx - cities[i].x;
        const dy = wy - cities[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const gaussian = Math.exp(-(dist * dist) / (2 * kernelWidth * kernelWidth));
        h -= weights[i] * gaussian;
      }

      field[gy * gridResolution + gx] = h;
    }
  }

  return field;
}
```

### Pattern 4: Isolation Weight Computation

**What:** Each city's weight equals its distance to its nearest neighbor. Outlier cities get the deepest wells.
**When to use:** Before height field computation, whenever cities change.
**Example:**
```typescript
export function computeIsolationWeights(cities: City[]): Float32Array {
  const n = cities.length;
  const weights = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    let minDist = Infinity;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dx = cities[i].x - cities[j].x;
      const dy = cities[i].y - cities[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) minDist = dist;
    }
    weights[i] = minDist;
  }

  // Normalize weights to [0, 1] range for consistent surface scaling
  const maxWeight = Math.max(...weights);
  if (maxWeight > 0) {
    for (let i = 0; i < n; i++) {
      weights[i] /= maxWeight;
    }
  }

  return weights;
}
```

### Anti-Patterns to Avoid

- **Importing Three.js or React in lib/ or store/:** Phase 1 code must be pure computation. If any file in `src/lib/` imports from `three`, `react`, or `@react-three/*`, the architecture is wrong.
- **Using Math.random() anywhere:** All randomness must flow through the seeded PRNG. A single `Math.random()` call breaks reproducibility.
- **Storing derived data in separate state fields without recomputation triggers:** The height field depends on cities + params. When either changes, the surface must be recomputed. Use an action that recomputes, or subscribe to changes.
- **Using a regular Array instead of Float32Array for the height field:** Regular arrays use 8 bytes per number, are not transferable to workers, and cannot be used directly as Three.js buffer data.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| State management | Custom event emitter / Context | Zustand 5 | Fine-grained subscriptions, works in/out of React, middleware ecosystem |
| Project scaffolding | Manual webpack/vite config | `npx create-next-app@latest` | Turbopack, TypeScript, ESLint pre-configured |

**What TO hand-roll (deliberately):**

| Problem | Why Hand-Roll | Notes |
|---------|---------------|-------|
| Seeded PRNG | 10 lines of code, no dependency needed | mulberry32 is public domain, well-understood |
| City preset generators | Domain-specific logic, no library exists | Each preset is 10-20 lines of geometry |
| Surface computation | Custom formula, no library exists | The gravitational well formula is the novel algorithm |
| Isolation weights | O(n^2) nearest neighbor, trivial at n=50 | No need for a spatial index library at this scale |

## Common Pitfalls

### Pitfall 1: Non-Deterministic City Generation

**What goes wrong:** Using `Math.random()` anywhere in the generation pipeline, or accidentally creating a new PRNG instance mid-generation, breaks seed reproducibility.
**Why it happens:** Easy to forget and use `Math.random()` in a utility function called by a generator.
**How to avoid:** Create the PRNG at the top of each generator function, pass it as a parameter to all helpers. Never import `Math.random` -- lint for it.
**Warning signs:** Same seed produces different layouts on refresh.

### Pitfall 2: Forgetting to Recompute Surface When Cities Change

**What goes wrong:** User selects a new preset, cities update, but the height field still shows the old surface.
**Why it happens:** The surface is derived state. If you store it without a recomputation trigger, it goes stale.
**How to avoid:** Either (a) call `recomputeSurface()` inside `setCities()` after updating cities, or (b) use Zustand's `subscribe` to watch for city/param changes and recompute automatically.
**Warning signs:** Surface and city positions are visually mismatched.

### Pitfall 3: City Coordinates Not Normalized

**What goes wrong:** Some presets generate cities in pixel coordinates (0-800), others in unit coordinates (0-1). The surface computation assumes one coordinate system but gets the other.
**Why it happens:** Each preset is written independently without a shared coordinate convention.
**How to avoid:** Establish a canonical coordinate space: all city positions in `[0, 1] x [0, 1]`. All generators must output in this range. The rendering layer maps to screen/world coordinates.
**Warning signs:** Surface wells appear in wrong positions, or all wells are clustered in one corner.

### Pitfall 4: Gaussian Kernel Width Not Scaled to City Density

**What goes wrong:** A fixed kernel width works for 20 cities but produces either a flat surface (too wide) or disconnected spikes (too narrow) for 10 or 50 cities.
**Why it happens:** The kernel width is an absolute value, but the "right" width depends on average inter-city distance.
**How to avoid:** Default kernel width should be a fraction of the average nearest-neighbor distance, not a fixed constant. Compute it adaptively, or at minimum provide a sensible default that works across the 10-50 city range.
**Warning signs:** Surface looks flat or spiky at certain city counts.

### Pitfall 5: Surface Computation Too Slow for Interactive Parameter Tweaking

**What goes wrong:** At 128x128 grid with 50 cities, the inner loop runs 128 * 128 * 50 = 819,200 iterations. If each iteration involves expensive math (multiple `Math.sqrt`, `Math.exp`), recomputation on every slider drag causes jank.
**Why it happens:** The computation is O(gridSize^2 * numCities) which is manageable but not instant.
**How to avoid:** For 128x128 with 50 cities, this should run in under 10ms on modern hardware -- benchmark to confirm. If slow: (a) debounce parameter changes, (b) use squared distances to avoid `Math.sqrt` where possible, (c) pre-compute `1 / (2 * sigma^2)` outside the inner loop, (d) consider a Web Worker for surface computation if it exceeds 16ms.
**Warning signs:** UI freezes when dragging parameter sliders.

## Code Examples

### Core Type Definitions

```typescript
// src/lib/types.ts

/** City position in normalized [0, 1] coordinate space */
export interface City {
  id: number;
  x: number;  // [0, 1]
  y: number;  // [0, 1]
}

/** Available preset city configurations */
export type PresetName =
  | 'random'
  | 'clustered'
  | 'circular'
  | 'grid'
  | 'star'
  | 'spiral';

/** Parameters controlling the gravitational surface */
export interface SurfaceParams {
  kernelWidth: number;    // Gaussian sigma, controls well radius
  liftAlpha: number;      // Centerpoint lift strength
  gridResolution: number; // Height field grid size (e.g., 128)
}

/** Precomputed surface data */
export interface SurfaceData {
  heightField: Float32Array;  // Flat array, size = gridResolution^2
  gridResolution: number;
  minHeight: number;          // For normalization by renderers
  maxHeight: number;
}
```

### City Preset Generators

```typescript
// src/lib/city-generator.ts

import { City, PresetName } from './types';
import { mulberry32 } from './prng';

export function generateCities(
  preset: PresetName,
  seed: number,
  count: number = 20
): City[] {
  const rng = mulberry32(seed);
  switch (preset) {
    case 'random':    return generateRandom(rng, count);
    case 'clustered': return generateClustered(rng, count);
    case 'circular':  return generateCircular(rng, count);
    case 'grid':      return generateGrid(rng, count);
    case 'star':      return generateStar(rng, count);
    case 'spiral':    return generateSpiral(rng, count);
  }
}

function generateRandom(rng: () => number, count: number): City[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: rng() * 0.8 + 0.1, // Margin from edges
    y: rng() * 0.8 + 0.1,
  }));
}

function generateCircular(rng: () => number, count: number): City[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count;
    const radius = 0.35 + rng() * 0.05; // Slight jitter
    return {
      id: i,
      x: 0.5 + radius * Math.cos(angle),
      y: 0.5 + radius * Math.sin(angle),
    };
  });
}

function generateClustered(rng: () => number, count: number): City[] {
  const numClusters = 3 + Math.floor(rng() * 3); // 3-5 clusters
  const cities: City[] = [];
  const clusterCenters = Array.from({ length: numClusters }, () => ({
    x: rng() * 0.6 + 0.2,
    y: rng() * 0.6 + 0.2,
  }));

  for (let i = 0; i < count; i++) {
    const center = clusterCenters[Math.floor(rng() * numClusters)];
    cities.push({
      id: i,
      x: Math.max(0, Math.min(1, center.x + (rng() - 0.5) * 0.15)),
      y: Math.max(0, Math.min(1, center.y + (rng() - 0.5) * 0.15)),
    });
  }
  return cities;
}

function generateGrid(rng: () => number, count: number): City[] {
  const side = Math.ceil(Math.sqrt(count));
  const cities: City[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % side;
    const row = Math.floor(i / side);
    cities.push({
      id: i,
      x: 0.15 + (col / (side - 1)) * 0.7 + (rng() - 0.5) * 0.02,
      y: 0.15 + (row / (side - 1)) * 0.7 + (rng() - 0.5) * 0.02,
    });
  }
  return cities;
}

function generateStar(rng: () => number, count: number): City[] {
  const cities: City[] = [];
  const points = 5;
  for (let i = 0; i < count; i++) {
    const arm = i % points;
    const angle = (2 * Math.PI * arm) / points;
    const t = rng() * 0.35; // distance along arm
    cities.push({
      id: i,
      x: 0.5 + t * Math.cos(angle) + (rng() - 0.5) * 0.03,
      y: 0.5 + t * Math.sin(angle) + (rng() - 0.5) * 0.03,
    });
  }
  return cities;
}

function generateSpiral(rng: () => number, count: number): City[] {
  return Array.from({ length: count }, (_, i) => {
    const t = i / count;
    const angle = t * 4 * Math.PI; // 2 full rotations
    const radius = 0.05 + t * 0.35;
    return {
      id: i,
      x: 0.5 + radius * Math.cos(angle) + (rng() - 0.5) * 0.02,
      y: 0.5 + radius * Math.sin(angle) + (rng() - 0.5) * 0.02,
    };
  });
}
```

### Next.js Static Export Configuration

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
};

export default nextConfig;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zustand v4 `create()` | Zustand v5 `create<T>()(...)` double-parens for middleware | v5.0 (2024) | TypeScript requires the curried form for middleware type inference |
| Next.js Pages Router | Next.js App Router | Next.js 13+ (2023) | All new code uses `app/` directory, `layout.tsx`, Server Components by default |
| `var seed = ...` global PRNG | Closure-based PRNG passed as parameter | Always best practice | Eliminates global state, enables parallel generation |

**Deprecated/outdated:**
- `ParametricGeometry` in Three.js: Removed from core, use PlaneGeometry with vertex displacement instead
- Zustand v4 `create(fn)` without type parameter: v5 requires `create<Type>()(fn)` for TypeScript

## Open Questions

1. **Gaussian vs Inverse-Distance Kernel**
   - What we know: The formula specifies `G` as either Gaussian or inverse-distance kernel. Gaussian produces smooth, bounded wells. Inverse-distance (`1/dist`) produces sharper, unbounded wells.
   - What's unclear: Which produces better TSP routes. This is the novel research question.
   - Recommendation: Start with Gaussian (bounded, well-behaved). Make kernel type a parameter in `SurfaceParams` so it can be switched later. Do NOT implement both in Phase 1 -- get one working first.

2. **Optimal Default Kernel Width**
   - What we know: Kernel width should relate to city density. Too narrow = disconnected spikes. Too wide = flat surface.
   - What's unclear: The right default for 10-50 cities in [0,1] space.
   - Recommendation: Default to `kernelWidth = 0.15` which produces ~3 city-widths of influence at typical densities. Make it a parameter. Tune empirically in Phase 2 when visualization is available.

3. **Surface Computation Performance Threshold**
   - What we know: 128x128 grid with 50 cities = 819K kernel evaluations with `Math.exp`. This should be under 10ms.
   - What's unclear: Exact performance on target hardware. Whether debouncing is needed.
   - Recommendation: Benchmark during implementation. If over 16ms, move to Web Worker. At this scale, it almost certainly will not need a worker.

## Sources

### Primary (HIGH confidence)
- [Zustand npm / documentation](https://www.npmjs.com/package/zustand) - v5.0.11, slices pattern, TypeScript usage
- [Zustand Slices Pattern (DeepWiki)](https://deepwiki.com/pmndrs/zustand/7.1-slices-pattern) - StateCreator types, cross-slice access
- [Next.js Static Exports Guide](https://nextjs.org/docs/app/guides/static-exports) - `output: 'export'` configuration
- [Float32Array MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array) - Typed array API, memory layout

### Secondary (MEDIUM confidence)
- [Mulberry32 PRNG article](https://emanueleferonato.com/2026/01/08/understanding-how-to-use-mulberry32-to-achieve-deterministic-randomness-in-javascript/) - Implementation and determinism properties
- [Mulberry32 GitHub](https://github.com/cprosche/mulberry32) - Reference implementation

### Tertiary (LOW confidence)
- Gravitational surface formula -- novel, no external source. Based on project description. The kernel evaluation and isolation weighting are straightforward math, but the specific parameter tuning (alpha, kernel width defaults) will need empirical validation in Phase 2.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zustand 5, Next.js 16, TypeScript 5.7 are all verified current stable releases
- Architecture: HIGH - Slices pattern, Float32Array for height fields, normalized coordinates are well-established patterns
- City generation: HIGH - Geometric preset patterns are straightforward math, seeded PRNG is well-understood
- Surface computation: MEDIUM - The formula is specified but parameter defaults and kernel choice need empirical tuning
- Pitfalls: HIGH - Based on project-level pitfalls research, particularly seed determinism and coordinate normalization

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable domain, 30 days)
