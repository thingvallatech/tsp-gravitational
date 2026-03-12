# Architecture Patterns

**Domain:** Interactive TSP algorithm visualization with 3D surface rendering
**Researched:** 2026-03-12

## Recommended Architecture

A layered architecture with four clear boundaries: **Data/Solver Layer**, **State Layer**, **Visualization Layer**, and **UI Shell**. The critical insight is that algorithm computation and rendering are fundamentally separate concerns that must not couple -- algorithms produce data, renderers consume it, and a reactive state store bridges them.

```
+------------------------------------------------------+
|                     UI Shell (Next.js)                |
|  +------------------+  +---------------------------+ |
|  | Parameter Panel  |  | Gallery Layout            | |
|  | Preset Selector  |  |  +-------+ +-------+     | |
|  | Stats Panel      |  |  | Algo  | | Algo  | ... | |
|  |                  |  |  | Card  | | Card  |     | |
|  +--------+---------+  |  +---+---+ +---+---+     | |
|           |             +------+----------+--------+ |
+-----------+--------------------+----------+----------+
            |                    |          |
     +------v--------------------v----------v------+
     |              State Layer (Zustand)           |
     |  cities[] | algorithms[] | params | scores   |
     |  solverResults Map<algoId, AlgoResult>       |
     +------+-------------------+------------------+
            |                   |
  +---------v--------+  +------v------------------+
  | Data/Solver Layer|  | Visualization Layer     |
  |                  |  |                         |
  | CityGenerator    |  | Three.js Scene (3D)     |
  | SurfaceComputer  |  |   HeightFieldMesh       |
  | AlgorithmRunner  |  |   CityMarkers           |
  |   (Web Workers)  |  |   TourPath              |
  | ScoringEngine    |  |                         |
  |                  |  | Canvas Overlays (2D)    |
  +------------------+  |   HeatmapRenderer       |
                        |   ContourRenderer       |
                        |   TourOverlay           |
                        |   AnimationController   |
                        +-------------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With | Input | Output |
|-----------|---------------|-------------------|-------|--------|
| **CityGenerator** | Create city sets from presets (random, clustered, circular, grid) | State Layer | Preset name + params | `City[]` with positions |
| **SurfaceComputer** | Evaluate h(x,y) height field function, compute isolation weights | State Layer | `City[]` + kernel params | `Float32Array` grid of heights |
| **AlgorithmRunner** | Execute TSP algorithms step-by-step, yield intermediate states | State Layer (via Web Worker messages) | `City[]` + algo config | `AlgoStep[]` sequence |
| **ScoringEngine** | Compute tour length, % from best, rank algorithms | State Layer | All `AlgoResult` entries | `ScoreCard[]` |
| **HeightFieldMesh** | Render 3D gravitational surface from height data | Three.js scene graph | `Float32Array` heights | WebGL rendered mesh |
| **CityMarkers** | Render 3D city positions on surface | Three.js scene graph | `City[]` + heights | 3D spheres/pins |
| **TourPath3D** | Render tour as 3D path along surface | Three.js scene graph | `Tour` + heights | 3D line geometry |
| **HeatmapRenderer** | Render 2D top-down heat visualization | Canvas element | `Float32Array` heights | Colored pixel grid |
| **ContourRenderer** | Render contour lines from height field | Canvas element | `Float32Array` heights + levels | Contour line paths |
| **TourOverlay** | Render 2D tour path with animation | Canvas element | `Tour` + animation frame | Animated line drawing |
| **AnimationController** | Manage playback (play/pause/step/speed) for algorithm execution | State Layer + Canvas | `AlgoStep[]` + playback state | Current step index |
| **ParameterPanel** | UI controls for kernel width, lift, weighting | State Layer | Current params | Updated params |
| **GalleryLayout** | Grid of algorithm cards showing all algorithms simultaneously | AlgoCard components | `AlgoResult[]` | Visual grid |
| **StatsPanel** | Scoring table, rankings, comparison metrics | State Layer | `ScoreCard[]` | Formatted table |

### Data Flow

Data flows **unidirectionally** in a React-idiomatic way:

```
1. User selects preset or changes params
      |
      v
2. CityGenerator produces City[]
      |
      v
3. State store updates cities + params
      |
      +---> SurfaceComputer recalculates height field
      |         |
      |         v
      |     State store updates heightField Float32Array
      |         |
      |         +---> HeightFieldMesh re-renders 3D surface
      |         +---> HeatmapRenderer re-draws 2D heatmap
      |         +---> ContourRenderer re-draws contour lines
      |
      +---> AlgorithmRunner (per algorithm, in Web Workers)
                |
                v
            Posts AlgoStep[] back to main thread
                |
                v
            State store updates solverResults
                |
                +---> AnimationController sequences steps
                +---> TourOverlay / TourPath3D render current step
                +---> ScoringEngine computes rankings
                         |
                         v
                     StatsPanel displays results
```

**Key principle:** No visualization component ever calls an algorithm directly. All communication goes through the state store. This allows the gallery to show 10+ algorithms without each one needing its own data pipeline.

## Core Architecture Decisions

### Decision 1: Zustand for State Management

**Recommendation:** Zustand over Jotai, Redux, or React Context.

**Why:** This app has a centralized data model (cities, params, results) that many components read from. Zustand's store-based approach maps naturally to this -- a single `useSolverStore` with slices for cities, params, heightField, and solverResults. It works well outside React (useful for Web Worker message handlers) and has minimal boilerplate. The R3F/Three.js ecosystem (pmndrs) also maintains Zustand, so integration patterns are well-established.

**Confidence:** HIGH -- Zustand is the standard choice for this pattern in 2025-2026.

### Decision 2: React Three Fiber over Vanilla Three.js

**Recommendation:** Use `@react-three/fiber` (R3F) with `@react-three/drei` helpers.

**Why:**
- Declarative scene graph matches React mental model -- the height field mesh is just a component that re-renders when height data changes
- Automatic cleanup of GPU resources when components unmount (critical for gallery with 10+ cards)
- `drei` provides OrbitControls, lighting presets, and performance helpers out of the box
- Same ecosystem as Zustand, so state integration is seamless
- No performance overhead -- R3F renders outside React's reconciliation for GPU-bound work

**When vanilla would be better:** If the 3D scene were extremely complex or needed custom render loops. At 10-50 cities with a single height field mesh, R3F is the right abstraction level.

**Confidence:** HIGH -- R3F is the standard approach for Three.js + React in 2025-2026.

### Decision 3: Raw Canvas 2D API over a Canvas Library

**Recommendation:** Use native `CanvasRenderingContext2D` directly, not a library like Konva or Fabric.

**Why:**
- The 2D overlays (heatmap, contours, tour lines) are generated procedurally from data, not interactive objects
- Canvas libraries add overhead for object management that's unnecessary here
- Heatmap rendering is pixel-level work best done with `ImageData` directly
- Contour rendering is path-based work best done with `ctx.beginPath()` / `ctx.lineTo()`
- Keeping it raw means full control over render timing (important for animation sync)

**Confidence:** HIGH -- standard approach for data-driven 2D visualization.

### Decision 4: Web Workers for Algorithm Execution

**Recommendation:** Run each algorithm in its own Web Worker. Use `comlink` for ergonomic Worker communication.

**Why:**
- TSP algorithms (especially SA, GA, ACO, 3-opt) can run for hundreds of milliseconds to seconds
- Running on main thread would freeze all 10+ visualization panels
- Web Workers allow algorithms to run in parallel across CPU cores
- `comlink` wraps the postMessage API so workers feel like async function calls

**Pattern:**
```typescript
// worker.ts
import { expose } from 'comlink';

const solver = {
  *solve(cities: City[], config: AlgoConfig): Generator<AlgoStep> {
    // yield intermediate steps for animation
    yield { tour: [...], cost: 42, description: "Added edge A->B" };
  }
};

expose(solver);
```

**Note:** Web Workers cannot yield generators across the boundary. Instead, the worker should batch steps and post them back periodically, or the runner can request steps one at a time. A practical pattern is: worker computes all steps, stores them in an array, and the main thread requests them in batches via comlink calls.

**Confidence:** HIGH for the pattern; MEDIUM for comlink specifically (may need to benchmark vs raw postMessage for step-heavy algorithms).

### Decision 5: PlaneGeometry with Vertex Displacement for Height Field

**Recommendation:** Use `THREE.PlaneGeometry` with vertex position modification, not a terrain library.

**Why:**
- The height field formula `h(x,y) = a * dist(centerpoint) - sum(wi * G(dist(cityi)))` is custom math, not procedural noise
- PlaneGeometry with sufficient segments (64x64 to 128x128) gives smooth surfaces for 10-50 cities
- Vertex positions are modified directly from the `Float32Array` height data
- Color mapping (vertex colors or a custom shader) shows elevation as the gravitational surface
- No need for terrain libraries designed for Perlin noise landscapes

**Confidence:** HIGH -- standard Three.js pattern for function-defined surfaces.

## Component Architecture Detail

### The Algorithm Card Pattern

Each algorithm in the gallery is an `<AlgoCard>` component. This is the most replicated component and needs clean boundaries:

```
AlgoCard
  +-- CardHeader (algorithm name, status badge)
  +-- MiniCanvas (small 2D tour visualization, ~300x300px)
  +-- ProgressBar (animation progress)
  +-- MiniStats (tour length, time, rank)
  +-- PlaybackControls (play/pause/step for this algorithm)
```

The `<AlgoCard>` subscribes to `useSolverStore(state => state.solverResults[algoId])` and re-renders only when its algorithm's data changes. This is critical -- with 10+ cards, you cannot afford global re-renders.

### The Hero Visualization (3D + 2D)

The main gravitational surface view is a larger, featured panel:

```
HeroVisualization
  +-- ThreeCanvas (R3F Canvas)
  |     +-- HeightFieldMesh
  |     +-- CityMarkers
  |     +-- TourPath3D
  |     +-- OrbitControls
  |     +-- Lighting
  +-- CanvasOverlay (positioned absolutely over or beside 3D)
  |     +-- HeatmapLayer
  |     +-- ContourLayer
  |     +-- TourLayer
  +-- ViewToggle (3D / 2D / Split)
```

### State Store Structure

```typescript
interface SolverStore {
  // City data
  cities: City[];
  preset: PresetName;
  setCities: (preset: PresetName) => void;

  // Surface parameters
  params: SurfaceParams; // kernelWidth, liftHeight, weightingStrategy
  setParams: (params: Partial<SurfaceParams>) => void;

  // Computed height field (recomputed when cities or params change)
  heightField: Float32Array | null;

  // Algorithm results (keyed by algorithm ID)
  solverResults: Map<string, AlgoResult>;

  // Playback state (per algorithm)
  playback: Map<string, PlaybackState>;

  // Scoring
  scores: ScoreCard[];

  // Actions
  runAllAlgorithms: () => void;
  runAlgorithm: (algoId: string) => void;
  setPlaybackState: (algoId: string, state: PlaybackState) => void;
}

interface AlgoResult {
  algoId: string;
  steps: AlgoStep[];      // full history for animation
  currentStep: number;    // which step is being displayed
  finalTour: number[];    // city indices in visit order
  tourLength: number;
  computeTimeMs: number;
  status: 'idle' | 'running' | 'complete';
}

interface AlgoStep {
  tour: number[];         // partial or complete tour at this step
  cost: number;
  edges?: [number, number][];  // edges being considered
  description: string;    // "Swapped cities 3 and 7"
}
```

## Patterns to Follow

### Pattern 1: Computed Derivations via Zustand Selectors

**What:** Derive the height field and scores from base state, don't store them redundantly.
**When:** Any time one piece of state is a pure function of another.
**Example:**
```typescript
// In a useEffect or Zustand middleware, recompute when dependencies change
const heightField = useMemo(() =>
  computeHeightField(cities, params),
  [cities, params]
);
```

Actually, for a `Float32Array` with 128x128 = 16K entries, this computation is fast enough to run synchronously on param change. Only algorithm execution needs workers.

### Pattern 2: Animation Loop with requestAnimationFrame

**What:** A shared animation ticker that advances all algorithm animations in sync.
**When:** Gallery mode where 10+ algorithms animate simultaneously.
**Example:**
```typescript
function useAnimationLoop() {
  const advanceAll = useSolverStore(s => s.advanceAllPlayback);

  useEffect(() => {
    let frameId: number;
    const tick = () => {
      advanceAll(); // advances currentStep for all playing algorithms
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);
}
```

### Pattern 3: Algorithm Registry Pattern

**What:** Algorithms are registered in a typed registry, not hard-coded into components.
**When:** You have 10+ algorithms that all conform to the same interface.
**Example:**
```typescript
interface TSPAlgorithm {
  id: string;
  name: string;
  category: 'construction' | 'improvement' | 'metaheuristic' | 'novel';
  description: string;
  solve: (cities: City[]) => AlgoStep[];
  // or for worker-based:
  workerPath: string;
}

const ALGORITHM_REGISTRY: TSPAlgorithm[] = [
  { id: 'nearest-neighbor', name: 'Nearest Neighbor', category: 'construction', ... },
  { id: 'greedy', name: 'Greedy', category: 'construction', ... },
  { id: '2-opt', name: '2-Opt', category: 'improvement', ... },
  // ...
];
```

The gallery just maps over this registry. Adding a new algorithm is adding one entry + one solver file.

### Pattern 4: Separation of Computation from Rendering

**What:** Solver functions are pure TypeScript with zero DOM/React/Three.js dependencies.
**When:** Always. This is the most important architectural principle.
**Why:**
- Pure functions are testable without rendering infrastructure
- Can run in Web Workers (workers have no DOM access)
- Can be swapped, benchmarked, or unit-tested independently
- The same solver code works whether visualization is 2D, 3D, or headless

## Anti-Patterns to Avoid

### Anti-Pattern 1: Coupling Algorithms to Visualization

**What:** Putting rendering code inside algorithm implementations (e.g., algorithm directly updates canvas).
**Why bad:** Cannot run algorithms in Web Workers, cannot test algorithms independently, cannot show same algorithm in different visual contexts (gallery card vs hero view).
**Instead:** Algorithms produce data (`AlgoStep[]`), renderers consume data. They never reference each other.

### Anti-Pattern 2: One Giant Canvas

**What:** Rendering all algorithms on a single shared canvas with manual coordinate math.
**Why bad:** Scaling nightmare, no component isolation, can't independently control each algorithm's animation, can't have per-algorithm interactions.
**Instead:** Each `<AlgoCard>` owns its own small canvas. The browser compositor handles layout.

### Anti-Pattern 3: Real-Time Algorithm Execution for Animation

**What:** Running the algorithm one step per animation frame, computing the next step live.
**Why bad:** Algorithm performance becomes coupled to frame rate. Slow algorithms freeze. Fast algorithms are artificially slowed. You can't scrub backward.
**Instead:** Run the algorithm to completion first (in a Web Worker), store all steps, then animate through the stored steps. This is the "pre-compute then playback" pattern. It allows pause, rewind, speed change, and scrubbing.

### Anti-Pattern 4: Shared Mutable State Between Workers

**What:** Multiple Web Workers writing to the same SharedArrayBuffer or store.
**Why bad:** Race conditions, debugging nightmares, and you don't need it -- each algorithm is independent.
**Instead:** Each worker computes independently and posts results back. The main thread is the single owner of state.

### Anti-Pattern 5: Re-rendering the Entire Gallery on Every State Change

**What:** Gallery component re-renders all 10+ cards when any algorithm updates.
**Why bad:** Massive performance hit, especially with canvas and Three.js teardown/setup.
**Instead:** Use Zustand selectors to subscribe each card to only its own algorithm's data. `useSolverStore(s => s.solverResults.get(algoId))` -- only re-renders when that specific result changes.

## Build Order (Dependencies)

This dependency graph determines what must be built first:

```
Phase 1: Foundation (no dependencies)
  - TypeScript types (City, Tour, AlgoStep, etc.)
  - City generator (presets)
  - Surface height field computation
  - Basic Zustand store structure

Phase 2: Core Visualization (depends on Phase 1)
  - 3D height field mesh (R3F + PlaneGeometry)
  - 2D heatmap renderer (Canvas)
  - 2D contour renderer (Canvas)
  - City markers (both 3D and 2D)

Phase 3: Algorithm Engine (depends on Phase 1 types, independent of Phase 2)
  - Algorithm interface definition
  - First 2-3 algorithms (nearest neighbor, greedy, 2-opt)
  - Web Worker runner infrastructure
  - Step recording / result storage

Phase 4: Animation & Playback (depends on Phase 2 + 3)
  - Animation controller (play/pause/step/speed)
  - Tour overlay rendering (2D animated path)
  - 3D tour path rendering
  - Playback controls UI

Phase 5: Gallery & Scoring (depends on Phase 3 + 4)
  - AlgoCard component
  - Gallery grid layout
  - Scoring engine
  - Stats panel with rankings

Phase 6: Remaining Algorithms (depends on Phase 3 infrastructure)
  - 3-opt, simulated annealing, genetic algorithm
  - Ant colony optimization
  - Christofides-like
  - Elastic net
  - Gravitational centerpoint (the novel one)

Phase 7: Polish (depends on all above)
  - Parameter panel with real-time updates
  - View toggle (3D/2D/split)
  - Batch comparison mode
  - Performance optimization
```

**Key insight:** Phase 3 (algorithms) and Phase 2 (visualization) can be built **in parallel** by different work streams because they communicate only through the state store defined in Phase 1. This is the primary architectural win.

## Scalability Considerations

| Concern | 5 Algorithms | 10+ Algorithms | Notes |
|---------|-------------|----------------|-------|
| Canvas instances | Fine, each gets own canvas | Monitor GPU memory, consider virtualizing off-screen cards | Each canvas is ~300x300, manageable |
| Web Workers | One per algorithm, 5 workers | Browser limits (~8-20 workers). Pool workers, run sequentially within pool | At 10-12 algorithms, a pool of 4-6 workers is safer |
| Animation frames | Trivial | 10+ canvas redraws per frame at 60fps = 600 draw calls/sec | Use `requestAnimationFrame` with dirty flags -- only redraw canvases whose step changed |
| State updates | Trivial | Batch updates to avoid 10+ sequential re-renders | Zustand batches by default in React 18+ |
| 3D scene | One scene, fine | If gallery cards each had 3D, 10+ WebGL contexts would crash | Only hero view gets 3D. Gallery cards use 2D canvas only |

## Sources

- [React Three Fiber documentation](https://r3f.docs.pmnd.rs/getting-started/introduction) -- R3F architecture and integration patterns (HIGH confidence)
- [tspvis by jhackshaw](https://github.com/jhackshaw/tspvis) -- Reference TSP visualizer using Web Workers + gallery pattern (MEDIUM confidence)
- [Zustand vs Jotai performance guide 2025](https://www.reactlibraries.com/blog/zustand-vs-jotai-vs-valtio-performance-guide-2025) -- State management comparison (MEDIUM confidence)
- [Three.js terrain from heightmap patterns](https://github.com/josdirksen/threejs-cookbook/blob/master/02-geometries-meshes/02.06-create-terrain-from-heightmap.html) -- PlaneGeometry vertex displacement (HIGH confidence)
- [OffscreenCanvas and Web Workers for animation](https://macarthur.me/posts/animate-canvas-in-a-worker/) -- Worker-based rendering patterns (MEDIUM confidence)
- [Algorithm Visualizer project](https://github.com/algorithm-visualizer) -- Step-based algorithm animation patterns (MEDIUM confidence)
