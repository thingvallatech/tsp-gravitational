# Phase 2: Visualization + Algorithms - Research

**Researched:** 2026-03-12
**Domain:** 3D/2D scientific visualization, TSP algorithm implementation, animation playback
**Confidence:** HIGH

## Summary

Phase 2 transforms the Phase 1 data layer (cities, surface heightfield) into interactive visualizations and a complete algorithm engine. The work splits into three independent streams that converge at the animation layer: (1) 3D height field rendering via React Three Fiber, (2) 2D heatmap/contour rendering via Canvas 2D + d3-contour, and (3) a step-based algorithm engine producing snapshots that the animation controller plays back.

The standard approach is: install R3F + Drei for 3D, use PlaneGeometry with direct vertex displacement from the existing Float32Array, use d3-contour with the same Float32Array for contour generation on Canvas 2D, implement algorithms as pure functions returning `AlgoStep[]` arrays, and use a pre-compute-then-playback pattern where algorithms run to completion (optionally in Web Workers) before animation begins.

**Primary recommendation:** Build the algorithm interface and first 3 algorithms (nearest neighbor, greedy, 2-opt) before building the animation system. Extract the common interface from working code. Use the pre-compute-then-playback pattern -- never run algorithms live during animation.

## Standard Stack

### Core (new for Phase 2)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | ^0.183.0 | 3D rendering engine | Industry standard, 2.7M weekly npm downloads. Already in devDependencies as @types/three |
| @react-three/fiber | ^9.5.0 | React renderer for Three.js | Declarative Three.js in JSX. Zero rendering overhead vs raw Three.js. Same ecosystem (pmndrs) as Zustand |
| @react-three/drei | ^10.7.0 | R3F helpers (OrbitControls, lighting) | OrbitControls, shaderMaterial, camera helpers out of the box |
| d3-contour | ^4.0.0 | Marching squares contour generation | Standard algorithm for contour lines from grid data. Works directly with Float32Array |
| d3-scale | ^4.0.0 | Color scale mapping | Maps height values to colors for heatmap rendering |
| d3-scale-chromatic | ^3.0.0 | Color palettes (Viridis, Plasma) | Pre-built sequential color schemes for scientific visualization |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/d3-contour | ^4.0.0 | TypeScript types | Always -- strict mode requires types |
| @types/d3-scale | ^4.0.0 | TypeScript types | Always |
| @types/d3-scale-chromatic | ^3.0.0 | TypeScript types | Always |

### Decided Against

| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| comlink | raw postMessage | For <10 algorithms posting step arrays, raw postMessage is simpler. Comlink adds a dependency for little gain when message shapes are simple (send cities, receive AlgoStep[]). Revisit if worker communication becomes complex. |
| OffscreenCanvas | Canvas 2D on main thread | OffscreenCanvas would move 2D rendering to a worker, but for a single heatmap + contour overlay the main thread Canvas 2D is fast enough. Premature optimization. |
| Custom shader for heightfield coloring | Vertex colors via bufferAttribute | Vertex colors are simpler to implement and sufficient for 128x128 grid. Custom shaders are an optimization for later. |
| Leva | Custom controls | Leva is planned for parameter controls but not needed in Phase 2. Phase 2 focuses on rendering and algorithms; Leva comes in Phase 3 or as polish. |

**Installation:**
```bash
npm install three @react-three/fiber @react-three/drei d3-contour d3-scale d3-scale-chromatic
npm install -D @types/d3-contour @types/d3-scale @types/d3-scale-chromatic
```

Note: `@types/three` is already in devDependencies.

## Architecture Patterns

### Recommended Project Structure for Phase 2

```
src/
├── algorithms/
│   ├── types.ts              # AlgoStep, AlgoResult, TSPAlgorithm interfaces
│   ├── registry.ts           # ALGORITHM_REGISTRY array
│   ├── runner.ts             # runAlgorithm dispatcher, Web Worker management
│   ├── tour-utils.ts         # tourLength, tourEdges, shared computation
│   ├── nearest-neighbor.ts   # Construction heuristic
│   ├── greedy.ts             # Construction heuristic
│   ├── two-opt.ts            # Improvement heuristic
│   ├── three-opt.ts          # Improvement heuristic
│   ├── simulated-annealing.ts
│   ├── genetic-algorithm.ts
│   ├── ant-colony.ts
│   ├── christofides-like.ts
│   ├── elastic-net.ts
│   └── gravitational.ts     # Novel heuristic using surface data
├── visualization/
│   ├── HeightFieldScene.tsx  # R3F Canvas + 3D scene (dynamically imported)
│   ├── HeightFieldMesh.tsx   # PlaneGeometry with vertex displacement
│   ├── CityMarkers3D.tsx    # Instanced spheres at city positions
│   ├── TourPath3D.tsx       # Line geometry for tour on surface
│   ├── Heatmap2D.tsx        # Canvas 2D heatmap component
│   ├── ContourOverlay.tsx   # d3-contour rendered on Canvas
│   ├── TourOverlay2D.tsx    # Tour path drawn on Canvas
│   └── color-scales.ts     # Shared color mapping utilities
├── animation/
│   ├── types.ts             # PlaybackState, AnimationConfig
│   ├── playback-controller.ts  # Play/pause/step/speed logic
│   └── usePlayback.ts      # React hook for animation loop
├── store/
│   ├── index.ts             # (existing) Combined store
│   ├── city-slice.ts        # (existing) Cities state
│   ├── surface-slice.ts     # (existing) Surface state
│   ├── algorithm-slice.ts   # NEW: algorithm results + playback state
│   └── animation-slice.ts   # NEW: animation playback state
├── workers/
│   └── solver.worker.ts     # Web Worker for heavy algorithms
├── components/
│   ├── CityCanvas.tsx       # (existing) Phase 1 city dot-plot
│   ├── AlgorithmPanel.tsx   # Algorithm selector + run button
│   ├── PlaybackControls.tsx # Play/pause/step/speed UI
│   └── StepNarration.tsx    # Text display of current step description
└── lib/
    ├── types.ts             # (existing) City, SurfaceData, SurfaceParams
    ├── prng.ts              # (existing) mulberry32
    ├── math-utils.ts        # (existing) euclideanDistance, etc.
    └── surface.ts           # (existing) computeHeightField
```

### Pattern 1: Pre-compute Then Playback

**What:** Algorithms run to completion producing an `AlgoStep[]` array. The animation controller scrubs through stored steps. Algorithms never run "live" during animation.

**When to use:** Always. This is the foundational pattern for the entire animation system.

**Why:** Enables pause, rewind, speed change, timeline scrubbing. Decouples algorithm performance from frame rate. Allows algorithms to run in Web Workers without UI coupling.

**Example:**
```typescript
// Algorithm produces all steps upfront
interface AlgoStep {
  tour: number[];           // city IDs in visit order (partial or complete)
  edges: [number, number][]; // edges being considered/added this step
  cost: number;             // current tour length
  description: string;      // "Connecting city 4 to city 7 (distance 0.12)"
}

interface AlgoResult {
  algoId: string;
  steps: AlgoStep[];        // full history
  finalTour: number[];
  tourLength: number;
  computeTimeMs: number;
}

// Run algorithm, get all steps
function solveNearestNeighbor(cities: City[]): AlgoStep[] {
  const steps: AlgoStep[] = [];
  // ... build tour, pushing a step for each city added
  return steps;
}

// Animation controller just indexes into steps[]
function usePlayback(steps: AlgoStep[]) {
  const [currentStep, setCurrentStep] = useState(0);
  // ... rAF loop advances currentStep based on speed setting
}
```

### Pattern 2: Dynamic Import for Three.js Components

**What:** All React Three Fiber components must be loaded with `next/dynamic` and `ssr: false` to avoid server-side rendering crashes.

**When to use:** Any component that imports from `three`, `@react-three/fiber`, or `@react-three/drei`.

**Example:**
```typescript
// src/app/page.tsx or wherever the 3D scene is mounted
import dynamic from 'next/dynamic';

const HeightFieldScene = dynamic(
  () => import('../visualization/HeightFieldScene'),
  { ssr: false }
);

// HeightFieldScene.tsx can freely import Three.js
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
// ...
```

### Pattern 3: PlaneGeometry Vertex Displacement from Float32Array

**What:** Create a PlaneGeometry, then directly modify its position attribute Z values from the existing `SurfaceData.heightField` Float32Array.

**When to use:** Rendering the 3D gravitational surface.

**Example:**
```typescript
// HeightFieldMesh.tsx
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';

function HeightFieldMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const surfaceData = useStore(s => s.surfaceData);

  useEffect(() => {
    if (!meshRef.current || !surfaceData) return;
    const geometry = meshRef.current.geometry;
    const position = geometry.attributes.position;
    const { heightField, gridResolution, minHeight, maxHeight } = surfaceData;
    const range = maxHeight - minHeight || 1;

    for (let i = 0; i < position.count; i++) {
      // PlaneGeometry vertices are laid out row-by-row matching our heightField
      const normalizedHeight = (heightField[i] - minHeight) / range;
      position.setZ(i, normalizedHeight * 0.5); // scale factor for visual height
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();
  }, [surfaceData]);

  const res = surfaceData?.gridResolution ?? 128;
  const segments = res - 1; // PlaneGeometry segments = vertices - 1

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1, 1, segments, segments]} />
      <meshStandardMaterial
        color="#4488ff"
        wireframe={false}
        side={THREE.DoubleSide}
        vertexColors={false}
      />
    </mesh>
  );
}
```

**Critical detail:** PlaneGeometry with `args={[width, height, widthSegments, heightSegments]}` creates `(widthSegments+1) * (heightSegments+1)` vertices. For a 128x128 heightfield, use `segments = 127` to get exactly 128*128 = 16,384 vertices matching the Float32Array length.

### Pattern 4: d3-contour with Existing Float32Array

**What:** Feed the Phase 1 heightField directly to `d3.contours()` to generate GeoJSON contour paths, then render them on Canvas 2D.

**When to use:** The 2D contour overlay.

**Example:**
```typescript
import { contours } from 'd3-contour';
import { scaleSequential } from 'd3-scale';
import { interpolateViridis } from 'd3-scale-chromatic';

function renderContours(
  ctx: CanvasRenderingContext2D,
  heightField: Float32Array,
  gridResolution: number,
  canvasSize: number
) {
  const contourGenerator = contours()
    .size([gridResolution, gridResolution])
    .thresholds(15); // ~15 contour levels

  // d3-contour accepts any array-like with numeric indices
  const contourData = contourGenerator(heightField as unknown as number[]);

  const scale = canvasSize / gridResolution;
  const colorScale = scaleSequential(interpolateViridis)
    .domain([contourData[0].value, contourData[contourData.length - 1].value]);

  ctx.save();
  ctx.scale(scale, scale);

  for (const c of contourData) {
    ctx.beginPath();
    // GeoJSON MultiPolygon: coordinates is array of polygons
    for (const polygon of c.coordinates) {
      for (const ring of polygon) {
        ctx.moveTo(ring[0][0], ring[0][1]);
        for (let i = 1; i < ring.length; i++) {
          ctx.lineTo(ring[i][0], ring[i][1]);
        }
        ctx.closePath();
      }
    }
    ctx.strokeStyle = colorScale(c.value);
    ctx.lineWidth = 0.5 / scale;
    ctx.stroke();
  }

  ctx.restore();
}
```

**Note on d3-contour indexing:** d3-contour expects `values[i + j * n]` where i is column, j is row. The existing `computeHeightField` uses `heightField[gy * gridResolution + gx]` which is `values[j * n + i]` -- same ordering. Compatible.

### Pattern 5: Algorithm Registry

**What:** A typed array of algorithm descriptors that the UI maps over. Adding an algorithm = adding one file + one registry entry.

**When to use:** Always. This is how the algorithm selector, gallery, and runner discover algorithms.

**Example:**
```typescript
// src/algorithms/types.ts
export interface AlgoStep {
  tour: number[];
  edges: [number, number][];
  cost: number;
  description: string;
}

export type AlgorithmCategory = 'construction' | 'improvement' | 'metaheuristic' | 'novel';

export interface TSPAlgorithm {
  id: string;
  name: string;
  category: AlgorithmCategory;
  color: string;              // distinct color for tour rendering
  description: string;
  solve: (cities: City[], surfaceData?: SurfaceData) => AlgoStep[];
  requiresSurface?: boolean;  // true for gravitational heuristic
}

// src/algorithms/registry.ts
export const ALGORITHM_REGISTRY: TSPAlgorithm[] = [
  { id: 'nearest-neighbor', name: 'Nearest Neighbor', category: 'construction',
    color: '#ff6b6b', description: 'Greedily visit closest unvisited city',
    solve: solveNearestNeighbor },
  { id: 'greedy', name: 'Greedy', category: 'construction',
    color: '#ffa502', description: 'Add shortest available edge',
    solve: solveGreedy },
  { id: '2-opt', name: '2-Opt', category: 'improvement',
    color: '#1dd1a1', description: 'Iteratively uncross edges',
    solve: solveTwoOpt },
  // ... 7+ more
  { id: 'gravitational', name: 'Gravitational Centerpoint', category: 'novel',
    color: '#a29bfe', description: 'Drainage-based tour from gravitational surface',
    solve: solveGravitational, requiresSurface: true },
];
```

### Pattern 6: Web Worker for Heavy Algorithms

**What:** Algorithms that take >50ms (SA, GA, ACO, 3-opt) run in a Web Worker to keep the UI responsive.

**When to use:** Any algorithm with iteration counts > 1000 or O(n^3) complexity.

**Example:**
```typescript
// src/workers/solver.worker.ts
const ctx = self as unknown as Worker;

ctx.addEventListener('message', (event) => {
  const { algoId, cities, surfaceData } = event.data;
  const t0 = performance.now();
  const steps = runAlgorithm(algoId, cities, surfaceData);
  const computeTimeMs = performance.now() - t0;
  ctx.postMessage({ algoId, steps, computeTimeMs });
});

// src/algorithms/runner.ts
export function runInWorker(
  algoId: string,
  cities: City[],
  surfaceData?: SurfaceData
): Promise<{ steps: AlgoStep[]; computeTimeMs: number }> {
  return new Promise((resolve) => {
    const worker = new Worker(
      new URL('../workers/solver.worker.ts', import.meta.url),
      { type: 'module' }
    );
    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
    };
    // Float32Array must be copied (structured clone), not transferred
    worker.postMessage({ algoId, cities, surfaceData });
  });
}
```

**Next.js Web Worker pattern:** Use `new URL('./worker.ts', import.meta.url)` with `{ type: 'module' }`. No next.config changes needed for Webpack 5 (which Next.js 16 uses). The URL must be a literal `new URL(...)` -- cannot store in a variable (webpack limitation).

### Anti-Patterns to Avoid

- **Algorithm imports Three.js:** If any file in `src/algorithms/` imports from `three` or `@react-three/fiber`, the architecture is wrong. Algorithms are pure TypeScript.
- **Live computation during animation:** Never run algorithm steps in the rAF loop. Pre-compute all steps, then animate.
- **Global re-renders on step change:** Use Zustand selectors. Each component subscribes only to the data it needs: `useStore(s => s.algorithmResults[algoId])`.
- **Sharing canvas between 3D and 2D:** The R3F Canvas and the 2D Canvas are separate DOM elements. Do not try to overlay them on the same canvas context.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Contour line generation | Marching squares implementation | `d3-contour` | Edge cases in marching squares (saddle points, boundary conditions) take weeks to get right. d3-contour handles them all. |
| Color gradient mapping | Manual RGB interpolation | `d3-scale` + `d3-scale-chromatic` | Perceptually uniform color spaces (Viridis, Plasma) are mathematically complex. d3's palettes are designed by color scientists. |
| 3D camera controls | Custom mouse/touch orbit handler | `@react-three/drei` OrbitControls | Smooth damping, touch support, zoom limits, polar angle constraints -- hundreds of edge cases already solved. |
| Tour distance calculation | Inline distance sums | Shared `tourLength(cities, tour)` utility | Will be called thousands of times across all algorithms. Must be consistent. Write once in `tour-utils.ts`. |
| 3D normal computation | Manual cross-product normals | `geometry.computeVertexNormals()` | Three.js handles averaging normals at shared vertices automatically. |
| Worker message serialization | Custom serialization for Float32Array | Structured clone (default postMessage) | postMessage already handles Float32Array via structured clone. No need for manual serialization. |

**Key insight:** The visualization layer has well-solved sub-problems (contours, color scales, camera controls). Algorithms are the novel work; visualization should use existing tools.

## Common Pitfalls

### Pitfall 1: SSR Crash from Three.js Imports
**What goes wrong:** Any module-level import of `three` crashes the Next.js build with "window is not defined". Even `"use client"` is not sufficient -- Client Components are still pre-rendered on the server.
**Why it happens:** Three.js accesses `window`, `document`, and WebGL APIs at import time.
**How to avoid:** Wrap ALL Three.js-containing components in `next/dynamic` with `{ ssr: false }`. Put the dynamic import boundary at the component that renders `<Canvas>`. Never import Three.js at the page level.
**Warning signs:** Build errors mentioning `window`, `document`, or `navigator` is not defined.

### Pitfall 2: PlaneGeometry Vertex Count Mismatch
**What goes wrong:** HeightField has `gridResolution * gridResolution` values (e.g., 128*128 = 16,384). PlaneGeometry with `args={[1, 1, 128, 128]}` creates 129*129 = 16,641 vertices. Off-by-one causes visual artifacts or crashes.
**Why it happens:** PlaneGeometry `segments` parameter means divisions, not vertices. Segments N = vertices N+1.
**How to avoid:** Use `segments = gridResolution - 1`. For a 128x128 heightfield: `args={[1, 1, 127, 127]}` creates 128*128 vertices.
**Warning signs:** Last row/column of terrain looks flat or random garbage values.

### Pitfall 3: Algorithms Coupled to Rendering
**What goes wrong:** Algorithm code directly manipulates canvas or Three.js objects. Cannot run in Web Worker, cannot test without browser, cannot change visualization without changing algorithm.
**Why it happens:** Seems faster to "draw as you go" rather than producing data snapshots.
**How to avoid:** Strict rule: `src/algorithms/` has zero imports from `three`, `react`, or any DOM API. Algorithms return `AlgoStep[]` arrays. Renderers consume them.
**Warning signs:** Algorithm file imports `THREE` or `useRef`.

### Pitfall 4: Animation Speed Tied to Frame Rate
**What goes wrong:** Animation advances one step per frame. On 144Hz monitor, animation is 2.4x faster than on 60Hz.
**Why it happens:** Using `requestAnimationFrame` without delta-time accumulation.
**How to avoid:** Use a time accumulator pattern:
```typescript
let accumulated = 0;
const stepIntervalMs = 200; // configurable speed

function tick(deltaMs: number) {
  accumulated += deltaMs;
  while (accumulated >= stepIntervalMs) {
    advanceStep();
    accumulated -= stepIntervalMs;
  }
}
```
**Warning signs:** Algorithm animations run at different speeds on different machines.

### Pitfall 5: Three.js Memory Leaks on City Regeneration
**What goes wrong:** When user regenerates cities, the old HeightFieldMesh geometry and material stay in GPU memory. After many regenerations, memory blooms.
**Why it happens:** Three.js does not garbage-collect GPU resources. Must explicitly `.dispose()`.
**How to avoid:** React Three Fiber handles disposal automatically when components unmount or when geometry/material props change. Verify with `renderer.info.memory.geometries` -- should stay constant. If using refs to mutate geometry directly (as in the vertex displacement pattern), the same geometry object is reused, so no leak occurs.
**Warning signs:** `renderer.info.memory.geometries` or `textures` count increases over time.

### Pitfall 6: d3-contour Coordinate System Mismatch
**What goes wrong:** d3-contour outputs GeoJSON coordinates in grid-space (0 to gridResolution). Canvas expects pixel coordinates (0 to canvasSize). Contours render in the wrong position or at the wrong scale.
**Why it happens:** Forgetting to scale contour coordinates to canvas dimensions.
**How to avoid:** Apply `ctx.scale(canvasSize / gridResolution, canvasSize / gridResolution)` before drawing contour paths, or manually scale coordinates.

### Pitfall 7: Web Worker Cannot Access Zustand Store
**What goes wrong:** Trying to import the Zustand store inside a Web Worker fails because workers have no DOM access and Zustand may use React internals.
**Why it happens:** Workers run in a separate global scope with no React, no DOM.
**How to avoid:** Workers receive data via `postMessage` and return results via `postMessage`. The main thread is the only one that reads/writes the Zustand store. Workers are pure computation.

## Code Examples

### Complete 3D Scene Setup

```typescript
// src/visualization/HeightFieldScene.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import HeightFieldMesh from './HeightFieldMesh';
import CityMarkers3D from './CityMarkers3D';
import TourPath3D from './TourPath3D';

export default function HeightFieldScene() {
  return (
    <Canvas
      camera={{ position: [0.5, 0.8, 1.2], fov: 50 }}
      style={{ width: '100%', height: '500px' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <HeightFieldMesh />
      <CityMarkers3D />
      <TourPath3D />
      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        minDistance={0.3}
        maxDistance={3}
      />
    </Canvas>
  );
}
```

### Dynamically Loading the 3D Scene

```typescript
// In page.tsx or parent component
import dynamic from 'next/dynamic';

const HeightFieldScene = dynamic(
  () => import('../visualization/HeightFieldScene'),
  {
    ssr: false,
    loading: () => <div className="w-full h-[500px] bg-gray-800 animate-pulse" />,
  }
);
```

### Nearest Neighbor Algorithm with Step Recording

```typescript
// src/algorithms/nearest-neighbor.ts
import { City } from '../lib/types';
import { AlgoStep } from './types';
import { euclideanDistance } from '../lib/math-utils';
import { tourLength } from './tour-utils';

export function solveNearestNeighbor(cities: City[]): AlgoStep[] {
  const n = cities.length;
  if (n === 0) return [];

  const steps: AlgoStep[] = [];
  const visited = new Set<number>();
  const tour: number[] = [0]; // start at city 0
  visited.add(0);

  steps.push({
    tour: [...tour],
    edges: [],
    cost: 0,
    description: `Starting at city ${cities[0].id}`,
  });

  while (tour.length < n) {
    const current = tour[tour.length - 1];
    let bestDist = Infinity;
    let bestCity = -1;

    for (let i = 0; i < n; i++) {
      if (visited.has(i)) continue;
      const d = euclideanDistance(
        cities[current].x, cities[current].y,
        cities[i].x, cities[i].y
      );
      if (d < bestDist) {
        bestDist = d;
        bestCity = i;
      }
    }

    tour.push(bestCity);
    visited.add(bestCity);

    steps.push({
      tour: [...tour],
      edges: [[current, bestCity]],
      cost: tourLength(cities, tour),
      description: `Nearest Neighbor: connecting city ${cities[current].id} to city ${cities[bestCity].id} (distance ${bestDist.toFixed(3)})`,
    });
  }

  // Close the tour
  const finalCost = tourLength(cities, tour);
  steps.push({
    tour: [...tour],
    edges: [[tour[tour.length - 1], tour[0]]],
    cost: finalCost,
    description: `Tour complete: returning to city ${cities[tour[0]].id} (total distance ${finalCost.toFixed(3)})`,
  });

  return steps;
}
```

### 2-Opt with Step Recording

```typescript
// src/algorithms/two-opt.ts
export function solveTwoOpt(cities: City[]): AlgoStep[] {
  const n = cities.length;
  const steps: AlgoStep[] = [];

  // Start with nearest-neighbor tour (or any initial tour)
  let tour = Array.from({ length: n }, (_, i) => i);
  let bestCost = tourLength(cities, tour);
  let improved = true;

  steps.push({
    tour: [...tour],
    edges: [],
    cost: bestCost,
    description: '2-Opt: starting with initial tour',
  });

  while (improved) {
    improved = false;
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n; j++) {
        // Reverse segment between i+1 and j
        const newTour = [...tour];
        newTour.splice(i + 1, j - i, ...tour.slice(i + 1, j + 1).reverse());
        const newCost = tourLength(cities, newTour);

        if (newCost < bestCost) {
          steps.push({
            tour: [...newTour],
            edges: [[tour[i], tour[j]], [tour[i + 1], tour[(j + 1) % n]]],
            cost: newCost,
            description: `2-Opt: swapping edges (${cities[tour[i]].id}-${cities[tour[i+1]].id}) and (${cities[tour[j]].id}-${cities[tour[(j+1)%n]].id}), saving ${(bestCost - newCost).toFixed(3)}`,
          });
          tour = newTour;
          bestCost = newCost;
          improved = true;
        }
      }
    }
  }

  steps.push({
    tour: [...tour],
    edges: [],
    cost: bestCost,
    description: `2-Opt: converged at distance ${bestCost.toFixed(3)}`,
  });

  return steps;
}
```

### Heatmap Rendering from Float32Array

```typescript
// src/visualization/Heatmap2D.tsx
import { scaleSequential } from 'd3-scale';
import { interpolateViridis } from 'd3-scale-chromatic';

export function renderHeatmap(
  ctx: CanvasRenderingContext2D,
  heightField: Float32Array,
  gridResolution: number,
  canvasSize: number,
  minHeight: number,
  maxHeight: number
) {
  const imageData = ctx.createImageData(gridResolution, gridResolution);
  const colorScale = scaleSequential(interpolateViridis)
    .domain([maxHeight, minHeight]); // inverted: low = dark (wells), high = bright

  for (let i = 0; i < heightField.length; i++) {
    const color = colorScale(heightField[i]);
    // d3 color returns "rgb(r, g, b)" string -- parse it
    const match = color.match(/\d+/g)!;
    const idx = i * 4;
    imageData.data[idx] = parseInt(match[0]);
    imageData.data[idx + 1] = parseInt(match[1]);
    imageData.data[idx + 2] = parseInt(match[2]);
    imageData.data[idx + 3] = 255;
  }

  // Draw at grid resolution, then scale
  const offscreen = new OffscreenCanvas(gridResolution, gridResolution);
  const offCtx = offscreen.getContext('2d')!;
  offCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(offscreen, 0, 0, canvasSize, canvasSize);
}
```

**Performance note:** For 128x128 = 16,384 pixels, parsing RGB strings is fast enough (<1ms). For larger grids, pre-compute a color LUT mapping normalized height [0,255] to RGBA values.

### Algorithm Zustand Slice

```typescript
// src/store/algorithm-slice.ts
import { StateCreator } from 'zustand';
import { AlgoResult } from '../algorithms/types';
import type { StoreState } from './index';

export interface AlgorithmSlice {
  algorithmResults: Record<string, AlgoResult>;
  setAlgorithmResult: (algoId: string, result: AlgoResult) => void;
  clearAlgorithmResults: () => void;
  // Playback state per algorithm
  playbackStep: Record<string, number>;
  setPlaybackStep: (algoId: string, step: number) => void;
  playbackSpeed: number; // ms per step
  setPlaybackSpeed: (speed: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export const createAlgorithmSlice: StateCreator<StoreState, [], [], AlgorithmSlice> = (set) => ({
  algorithmResults: {},
  setAlgorithmResult: (algoId, result) =>
    set((state) => ({
      algorithmResults: { ...state.algorithmResults, [algoId]: result },
    })),
  clearAlgorithmResults: () => set({ algorithmResults: {}, playbackStep: {} }),
  playbackStep: {},
  setPlaybackStep: (algoId, step) =>
    set((state) => ({
      playbackStep: { ...state.playbackStep, [algoId]: step },
    })),
  playbackSpeed: 300,
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  isPlaying: false,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `PlaneBufferGeometry` | `PlaneGeometry` | Three.js r125 (2021) | BufferGeometry merged into Geometry. Use `planeGeometry` in R3F JSX. |
| `attachObject={['attributes', 'position']}` | `attach="attributes-position"` | R3F v8 (2022) | New dash-syntax for nested attachments. |
| `geometry.vertices` (old Geometry) | `geometry.attributes.position` (BufferGeometry) | Three.js r125 | All vertex access is through buffer attributes now. |
| Worker-loader webpack plugin | `new URL('./worker.ts', import.meta.url)` | Webpack 5 (2020) | Native webpack support for workers. No plugin needed. |
| `d3-contour` v3 | `d3-contour` v4 | 2023 | ESM-only. Import as `import { contours } from 'd3-contour'`. |

**Deprecated/outdated:**
- `THREE.Geometry`: Removed in r125. Use BufferGeometry only.
- `worker-loader`: Unnecessary with Webpack 5+.
- `react-three-fiber` (old package name): Use `@react-three/fiber`.
- `ParametricGeometry`: Moved to examples/addons. Use PlaneGeometry + vertex displacement.

## Algorithm Implementation Notes

### Full Algorithm List (10+ required)

| Algorithm | Category | Step Count (20 cities) | Needs Worker? | Step Description Pattern |
|-----------|----------|----------------------|---------------|--------------------------|
| Nearest Neighbor | Construction | N (~20) | No | "Connecting city A to nearest unvisited city B" |
| Greedy | Construction | O(N^2) edges sorted (~200) | No | "Adding shortest edge A-B" |
| 2-Opt | Improvement | Variable (50-500) | No | "Swapping edges, saved X" |
| 3-Opt | Improvement | Variable (100-2000) | Maybe | "Testing 3-edge swap at positions i,j,k" |
| Simulated Annealing | Metaheuristic | 1000-10000 iterations | Yes | "T=X: accepted/rejected swap, cost Y" |
| Genetic Algorithm | Metaheuristic | 100-500 generations | Yes | "Gen X: best fitness Y, crossover/mutation" |
| Ant Colony Opt. | Metaheuristic | 50-200 iterations | Yes | "Iteration X: best ant found tour of length Y" |
| Christofides-like | Construction | ~5 major steps | No | "MST computed / Perfect matching / Euler circuit" |
| Elastic Net | Novel | 100-500 iterations | Maybe | "Iteration X: net deforming, closest city-node pairs" |
| Gravitational Centerpoint | Novel | ~N + drainage steps | No | "Lifting from centroid / Following drainage path through city A" |

### Gravitational Centerpoint Heuristic Design

This is the novel algorithm unique to this project. Based on context:
- Uses the existing `SurfaceData.heightField` from Phase 1
- Cities are weighted by isolation (already implemented in `computeIsolationWeights`)
- Surface is "lifted" from centroid (already in `computeHeightField` via `liftAlpha`)
- Tour is constructed by following drainage/watershed paths through the surface

**Proposed implementation approach:**
1. Start at the centroid lift point (highest point on surface)
2. Simulate water flowing downhill using gradient descent on the heightfield
3. When flow reaches a city's well, add that city to the tour
4. After visiting a well, "fill" it (raise its height) and continue drainage
5. The tour order is the order in which drainage reaches each city

**Confidence: MEDIUM** -- This algorithm is novel and not documented anywhere. The implementation will require experimentation. The surface data and math utilities from Phase 1 provide the foundation.

### Improvement Algorithms Need Initial Tours

2-Opt, 3-Opt, and other improvement heuristics need a starting tour. Options:
- Use nearest-neighbor as the default initial tour
- Accept an `initialTour` parameter so users can chain algorithms
- Record both the construction phase and improvement phase in the step history

### Algorithm Color Palette

10+ distinct colors that are visually distinguishable on both dark backgrounds and the heatmap:

```typescript
export const ALGORITHM_COLORS: Record<string, string> = {
  'nearest-neighbor': '#ff6b6b',  // red
  'greedy':           '#ffa502',  // orange
  '2-opt':            '#1dd1a1',  // green
  '3-opt':            '#00d2d3',  // cyan
  'simulated-annealing': '#ff9ff3', // pink
  'genetic-algorithm':   '#f368e0', // magenta
  'ant-colony':          '#ff6348', // coral
  'christofides':        '#7bed9f', // light green
  'elastic-net':         '#70a1ff', // blue
  'gravitational':       '#a29bfe', // purple
};
```

## Open Questions

1. **Gravitational heuristic drainage implementation**
   - What we know: Surface exists, isolation weights exist, centroid lift exists
   - What's unclear: Exact gradient descent / watershed algorithm on discrete grid. How to handle ties, saddle points, multiple drainage basins
   - Recommendation: Implement a simple steepest-descent walker on the heightfield grid. Start with the naive approach (check 8 neighbors, move to lowest), refine if visual quality is poor

2. **Web Worker strategy: pool vs one-per-algorithm**
   - What we know: Browsers support 8-20 workers. We have 10+ algorithms.
   - What's unclear: Whether creating 10 workers simultaneously causes issues
   - Recommendation: Start with sequential execution (one worker at a time). Optimize to a pool of 4 workers if needed. For Phase 2, most algorithms are fast enough to run on main thread anyway -- only SA, GA, ACO truly need workers.

3. **Christofides-like: how "like"?**
   - What we know: True Christofides needs minimum-weight perfect matching, which is complex to implement
   - What's unclear: How approximate is acceptable
   - Recommendation: Implement MST-based tour (double the MST, shortcut) as the "Christofides-like" version. Skip perfect matching. Label it honestly in the UI.

4. **Elastic net algorithm specifics**
   - What we know: Elastic net is a neural-network-inspired TSP heuristic from 1987 (Durbin & Willshaw)
   - What's unclear: Parameter tuning for 10-50 cities in a [0,1] coordinate space
   - Recommendation: Implement with standard parameters from literature, add tuning if needed. This is a lower-priority algorithm.

## Sources

### Primary (HIGH confidence)
- [d3-contour official documentation](https://d3js.org/d3-contour/contour) -- API, input format, output GeoJSON structure
- [R3F vertex editing discussion #968](https://github.com/pmndrs/react-three-fiber/discussions/968) -- PlaneGeometry vertex displacement pattern
- [Drei documentation](https://drei.docs.pmnd.rs) -- OrbitControls, shaderMaterial, GradientTexture API
- [Next.js Web Worker with Comlink](https://park.is/blog_posts/20250417_nextjs_comlink_examples/) -- Worker setup pattern for Next.js

### Secondary (MEDIUM confidence)
- [R3F Terrain generation (Medium)](https://nitinchotia.medium.com/exploring-procedural-terrain-generation-with-react-three-fiber-and-noise-js-2bfbde635378) -- PlaneGeometry heightmap pattern
- [Three.js terrain from heightmap (GitHub cookbook)](https://github.com/josdirksen/threejs-cookbook/blob/master/02-geometries-meshes/02.06-create-terrain-from-heightmap.html) -- Vertex displacement approach
- [Dynamic terrain deformation (Codrops)](https://tympanus.net/codrops/2024/11/27/creating-dynamic-terrain-deformation-with-react-three-fiber/) -- R3F terrain techniques
- [tspvis (GitHub)](https://github.com/jhackshaw/tspvis) -- Reference TSP visualizer architecture
- [Elevation contour plots with D3](https://yangdanny97.github.io/blog/2020/11/26/D3-elevations) -- d3-contour practical usage

### Tertiary (LOW confidence)
- Gravitational centerpoint heuristic design -- novel, no external sources. Based on project requirements and surface computation already in Phase 1.
- Elastic net TSP parameters -- based on training data knowledge of 1987 paper. Should verify with original paper if implementation is difficult.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries verified via official docs and npm
- Architecture (pre-compute/playback, registry, dynamic import): HIGH -- Established patterns in R3F and algorithm visualization communities
- 3D rendering (PlaneGeometry vertex displacement): HIGH -- Verified in R3F discussion, Three.js docs
- 2D rendering (d3-contour + Canvas): HIGH -- Verified via d3 official documentation
- Algorithm implementations (NN, greedy, 2-opt): HIGH -- Well-known algorithms with clear step definitions
- Heavy algorithm implementations (SA, GA, ACO): MEDIUM -- Standard algorithms but step granularity needs tuning
- Gravitational centerpoint heuristic: MEDIUM -- Novel algorithm, implementation requires experimentation
- Web Worker integration: MEDIUM -- Pattern is standard but untested with this specific Next.js 16 setup
- Pitfalls: HIGH -- Well-documented across multiple sources

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable libraries, 30-day window)
