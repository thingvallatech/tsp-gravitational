# Domain Pitfalls

**Domain:** Interactive TSP Algorithm Visualization with 3D Rendering
**Researched:** 2026-03-12

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Running Algorithm Computation on the Main Thread

**What goes wrong:** TSP algorithms (especially exact solvers, branch-and-bound, or even slower heuristics on 50 cities) block the main thread. The 3D render loop freezes, animations stutter, and the UI becomes unresponsive. The browser needs the main thread free every 16.67ms to maintain 60fps. A single algorithm step that takes longer than 50ms causes visible jank; a full solve can freeze the tab for seconds.

**Why it happens:** It is natural to implement algorithms as synchronous loops. Developers often start with `for` loops that compute the full solution, then try to bolt on visualization afterward. By then, the architecture makes it hard to yield control back to the render loop.

**Consequences:** Frozen UI during computation. Users cannot interact with the 3D scene, adjust parameters, or pause/resume. Side-by-side comparison of 10+ algorithms simultaneously makes this 10x worse -- all algorithms fighting for the same thread.

**Prevention:**
- Design algorithm runners as async generators (`async function*`) from the start, yielding state snapshots at each meaningful step
- For computationally heavy algorithms (branch-and-bound, simulated annealing with many iterations), use Web Workers to offload computation entirely
- Architect the algorithm interface around a step-based protocol: `{ step(): AlgorithmState, isDone(): boolean }` so every algorithm produces discrete snapshots
- Never write a synchronous solve loop that runs to completion

**Detection:** If you have any algorithm function that does not yield/return between steps, you have this problem. Test with the browser DevTools Performance tab -- any main thread task over 16ms during animation is a red flag.

**Phase relevance:** Must be solved in the algorithm engine phase, before any visualization work begins. Retrofitting async stepping onto synchronous solvers is a near-rewrite.

---

### Pitfall 2: Three.js Memory Leaks on Scene Updates

**What goes wrong:** When users change parameters, switch city sets, or reset the visualization, old Three.js objects (geometries, materials, textures, render targets) remain in GPU memory. Three.js does not garbage-collect WebGL resources automatically -- you must explicitly call `.dispose()` on every geometry, material, and texture. Missing even one causes a cumulative GPU memory leak.

**Why it happens:** JavaScript garbage collection handles CPU-side references, so developers assume GPU resources are also cleaned up. Three.js objects have a dual lifecycle: the JS object and the underlying WebGL buffers. Removing an object from the scene graph does NOT free its GPU resources.

**Consequences:** Memory grows with each parameter change or city regeneration. After 10-20 resets, the browser tab consumes hundreds of MB. On mobile or lower-end machines, this causes crashes. In React/Next.js specifically, component unmount/remount cycles (e.g., navigating away and back) compound the problem because React may destroy and recreate the component tree while GPU resources from the previous mount persist.

**Prevention:**
- Create a centralized disposal utility that traverses a scene graph and disposes all geometries, materials, and textures
- When updating the terrain mesh or tour lines, dispose the old geometry before creating new ones -- never just replace the reference
- Use `renderer.info.memory` to track geometry/texture counts during development; log these values and assert they stay bounded
- If using React Three Fiber, leverage its automatic disposal, but verify it with `renderer.info` anyway
- Pool and reuse geometries/materials where possible (e.g., city marker meshes can share a single geometry and material via instancing)

**Detection:** Open Chrome DevTools > Performance Monitor > JS Heap Size. Reset the visualization 10 times. If memory only goes up and never comes back down, you have a leak. Also check `renderer.info.memory.geometries` and `renderer.info.memory.textures` -- these should stay roughly constant.

**Phase relevance:** Must be addressed when building the 3D rendering layer. Create disposal patterns as part of the initial Three.js setup, not as an afterthought.

---

### Pitfall 3: Unfair Algorithm Comparison Due to Inconsistent Metrics

**What goes wrong:** Side-by-side algorithm comparison becomes misleading when algorithms are compared on different terms. Common failures: comparing a construction heuristic (nearest neighbor) against an improvement heuristic (2-opt) without clarifying that 2-opt requires an initial tour; comparing wall-clock time when algorithms have fundamentally different computational profiles; showing "steps" when one algorithm's step is O(1) and another's is O(n).

**Why it happens:** Each TSP algorithm has a different structure -- some are constructive (build a tour from scratch), some are improvement-based (refine an existing tour), some are population-based (genetic algorithms). Forcing them into a uniform comparison framework without accounting for these differences produces apples-to-oranges results.

**Consequences:** Users draw wrong conclusions about algorithm quality. The visualization becomes an unreliable educational tool. The gravitational centerpoint heuristic (the novel algorithm) may look unfairly good or bad depending on what metrics are shown.

**Prevention:**
- Define a clear, uniform metric set: total tour distance (primary), computation steps, wall-clock time, and solution quality ratio (tour distance / known optimal)
- Normalize "steps" to a consistent granularity -- define what constitutes a step for each algorithm class and document it
- Separate construction phase from improvement phase in the stats panel
- Use TSPLIB instances or reproducible random seeds so results are verifiable against known optima
- Show algorithm category labels (constructive, improvement, metaheuristic) in the comparison UI

**Detection:** If you cannot answer "what does one step mean for Algorithm X vs Algorithm Y?" with a consistent answer, the comparison is unfair. Review the stats panel and ask: could someone misinterpret these numbers?

**Phase relevance:** Must be defined during the algorithm interface design phase. The step protocol and metric definitions need to be standardized before implementing individual algorithms.

---

### Pitfall 4: Snapshot Architecture -- Failing to Separate Algorithm State from Visualization State

**What goes wrong:** Algorithm logic gets tangled with rendering code. The algorithm directly manipulates Three.js objects, or visualization state is stored inside algorithm data structures. This makes it impossible to: (a) run algorithms at different speeds, (b) step backward, (c) run algorithms without rendering (for benchmarking), or (d) serialize/replay algorithm execution.

**Why it happens:** The most intuitive approach is to have the algorithm "draw as it goes." This feels productive early on but creates a tight coupling that prevents every advanced feature you will want later.

**Consequences:** Cannot implement pause/resume, speed control, or step-backward without rewriting the algorithm. Cannot run headless benchmarks. Cannot decouple algorithm execution rate from render frame rate. Each new algorithm must know about Three.js, making the algorithm library non-portable.

**Prevention:**
- Implement a strict Model-View separation: algorithms produce pure data snapshots (ordered city lists, current tour edges, intermediate state), and a separate visualization layer consumes those snapshots
- Define a `AlgorithmSnapshot` type: `{ tour: number[], currentEdges: [number, number][], stats: { distance: number, steps: number }, metadata: Record<string, unknown> }`
- Algorithms must be pure functions of their input -- no side effects, no DOM/WebGL access
- Store snapshot history in an array to enable step-backward and timeline scrubbing
- The visualization layer interpolates between snapshots at whatever frame rate the renderer runs

**Detection:** If any algorithm file imports from Three.js or a rendering module, the architecture is wrong. If you cannot run an algorithm in a unit test without a browser environment, the architecture is wrong.

**Phase relevance:** This is a foundational architecture decision. Must be established before the first algorithm is implemented. Retrofitting snapshot architecture onto coupled code is a full rewrite.

---

## Moderate Pitfalls

Mistakes that cause delays or technical debt.

### Pitfall 5: Next.js SSR Conflicts with Three.js

**What goes wrong:** Three.js requires `window`, `document`, and WebGL context, none of which exist during server-side rendering. Next.js renders all components on the server first (even Client Components are pre-rendered server-side), so any Three.js import at the module level crashes the build or produces hydration mismatches.

**Prevention:**
- Use `next/dynamic` with `{ ssr: false }` for any component that imports Three.js
- Do NOT rely solely on `"use client"` -- Client Components are still pre-rendered on the server
- Lazy-load the entire 3D visualization component tree behind a dynamic import boundary
- Keep all Three.js imports inside dynamically-loaded components, never at the page level
- Consider whether Next.js is even necessary -- if the app is truly client-side only with no SSR needs, a plain Vite + React setup avoids this entire class of problems

**Detection:** Build errors containing "window is not defined" or "document is not defined." Hydration mismatch warnings in the console.

**Phase relevance:** Must be addressed in project scaffolding, before any 3D code is written. Get the dynamic import boundary right on day one.

---

### Pitfall 6: Animation Timing Tied to Frame Rate Instead of Clock Time

**What goes wrong:** Algorithm animation speed varies across devices. A fast machine runs through algorithm steps in 2 seconds; a slow machine takes 10 seconds. Animations use `position.x += 0.1` per frame instead of delta-time-based movement.

**Prevention:**
- Always use `clock.getDelta()` or the `delta` parameter from the render loop for any time-based animation
- Define animation speed as "steps per second" not "steps per frame"
- For algorithm stepping, use a timer/accumulator pattern: accumulate delta time, advance one algorithm step when accumulated time exceeds the step interval
- Provide a speed slider that controls the step interval (e.g., 100ms to 2000ms per step)

**Detection:** Run the visualization on a high-refresh-rate monitor (144Hz) and a throttled CPU. If the algorithm completes at different rates, timing is frame-dependent.

**Phase relevance:** Animation system design, before implementing algorithm playback controls.

---

### Pitfall 7: Height Field Mesh Resolution Mismatch

**What goes wrong:** The gravitational centerpoint heuristic requires a height field (terrain surface) that represents the gravitational potential. If the mesh resolution is too low, the drainage paths are blocky and inaccurate, making the algorithm look bad. If too high, the geometry has millions of vertices and tanks rendering performance.

**Prevention:**
- Start with a configurable grid resolution (e.g., 64x64 to 256x256) and profile rendering FPS at each level
- For 10-50 cities, a 128x128 grid (16K vertices) should be sufficient and performant
- Use a shader-based approach for the height field visualization rather than modifying geometry vertices on the CPU -- this keeps the vertex count fixed while allowing GPU-side height displacement
- Separate the algorithm's internal height field resolution from the rendering mesh resolution -- the algorithm can compute on a finer grid while the visualization approximates it
- Provide a quality/performance toggle for users

**Detection:** Visual artifacts like staircase patterns in drainage paths, or FPS drops below 30 when the terrain is visible.

**Phase relevance:** 3D rendering phase, specifically when implementing the gravitational surface visualization.

---

### Pitfall 8: Overengineering the Algorithm Interface Before Implementing Algorithms

**What goes wrong:** Developers spend weeks designing the "perfect" generic algorithm interface that handles every possible algorithm type, only to discover that real algorithms do not fit the abstraction. The interface is either too restrictive (cannot express simulated annealing's temperature schedule) or too generic (provides no useful type safety).

**Prevention:**
- Implement 3 concrete algorithms first (nearest neighbor, 2-opt, and the gravitational heuristic) with minimal abstraction
- Extract the common interface from working code, not from theory
- Accept that some algorithms will need interface extensions -- design for extensibility, not universality
- The core interface should be small: `init(cities) -> state`, `step(state) -> state`, `isDone(state) -> boolean`, `getSnapshot(state) -> Snapshot`

**Detection:** If you have spent more than 2 days on the algorithm interface without implementing a single algorithm, you are overengineering.

**Phase relevance:** Algorithm engine phase. Implement concrete algorithms first, extract abstractions second.

---

### Pitfall 9: Side-by-Side Layout That Does Not Scale

**What goes wrong:** The UI is designed for comparing 2-3 algorithms, but the requirement is 10+. A naive grid layout becomes unusable at 10+ panels -- each viewport is too small to see, and rendering 10+ Three.js scenes simultaneously destroys performance.

**Prevention:**
- Do NOT render 10+ independent Three.js scenes. Use a single shared 3D viewport that overlays multiple tours with different colors/styles
- Provide a 2D comparison mode (top-down orthographic projection of tours) alongside the 3D view -- 2D is far cheaper to render and easier to compare visually
- Use a tabbed or selectable comparison: let users pick 2-4 algorithms to compare visually, while showing all 10+ results in a summary stats table
- Consider a single 3D scene with toggle-able algorithm overlays rather than split viewports
- Stats comparison (distance, steps, time) works fine in a table for 10+ algorithms; visual comparison does not

**Detection:** Try the UI with 10 panels. If any panel is smaller than 200x200 pixels, or if FPS drops below 30, the layout does not scale.

**Phase relevance:** UI/layout phase. Make the layout decision before building the comparison infrastructure.

---

### Pitfall 10: Playback Controls That Cannot Handle Algorithm Asymmetry

**What goes wrong:** A global play/pause/speed control assumes all algorithms step at the same rate. But nearest neighbor completes in N steps while simulated annealing takes 10,000 iterations. Synchronized stepping means either the fast algorithm waits endlessly or the slow algorithm is forced to skip steps.

**Prevention:**
- Allow independent speed controls per algorithm, or normalize by "percentage of completion" rather than step count
- Provide two comparison modes: synchronized (all algorithms at same completion percentage) and independent (each runs at its own natural pace)
- Show a progress bar per algorithm so users can see relative completion rates
- For the "race" view, let algorithms run in real-time and see which finishes first -- this is more intuitive than trying to synchronize incompatible step counts

**Detection:** Compare nearest neighbor (finishes in ~50 steps) against simulated annealing (finishes in ~5000 steps) with synchronized playback. If the experience is bad, the controls are not handling asymmetry.

**Phase relevance:** Playback/controls phase, after the algorithm engine is working.

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 11: City Points Obscured by the 3D Terrain

**What goes wrong:** When viewing the height field at oblique angles, city markers and tour edges clip into or hide behind the terrain surface. Labels become unreadable against the terrain texture.

**Prevention:**
- Render city markers and tour edges with a slight Z-offset above the terrain surface
- Use `depthTest: false` or render order manipulation for labels to ensure they are always visible
- Provide an "X-ray" or wireframe mode for the terrain so tour paths are always visible
- Add a 2D minimap or overhead view as an alternative perspective

**Detection:** Rotate the 3D camera to various angles. If any cities or edges disappear behind terrain, this needs fixing.

**Phase relevance:** 3D rendering polish phase.

---

### Pitfall 12: Random City Generation Without Seeds

**What goes wrong:** Each page refresh produces different city positions, making it impossible to reproduce results, compare algorithm runs, or debug issues. Users cannot share interesting configurations.

**Prevention:**
- Use a seeded PRNG (e.g., a simple mulberry32 or xoshiro implementation) for city generation
- Display and allow input of the seed value in the UI
- Include preset city configurations (circle, cluster, grid, random) for consistent demonstration
- Store seed in URL query params for shareability

**Detection:** Refresh the page twice. If the city layout is different, you need seeds.

**Phase relevance:** Data layer setup, early in development.

---

### Pitfall 13: Camera Controls Conflicting with UI Controls

**What goes wrong:** OrbitControls (or similar) consume mouse/touch events globally, preventing interaction with HTML overlay elements like sliders, dropdowns, and buttons that sit on top of the 3D canvas.

**Prevention:**
- Disable OrbitControls when the pointer is over UI elements (check `event.target`)
- Use pointer-events CSS to create clear interaction boundaries between 3D canvas and HTML overlays
- Place UI controls outside the canvas element, not overlaid on top of it
- If overlay controls are necessary, stop event propagation from UI elements to the canvas

**Detection:** Try to drag a slider that overlaps with the 3D canvas. If the camera moves instead, controls are conflicting.

**Phase relevance:** UI layout phase.

---

### Pitfall 14: Stats Panel Updating Every Frame

**What goes wrong:** Displaying algorithm statistics (distance, step count, timing) that update on every animation frame causes layout thrashing and hurts performance. DOM updates are expensive compared to WebGL rendering.

**Prevention:**
- Throttle stats panel updates to 2-4 times per second, not every frame
- Use `requestAnimationFrame` only for the 3D render loop; update DOM stats on a separate, slower interval
- Consider using CSS transforms or canvas-based stats rendering instead of DOM manipulation for frequently-changing values
- React: use refs for rapidly-updating values, not state, to avoid re-renders

**Detection:** Open Chrome DevTools Performance tab. If "Recalculate Style" or "Layout" events dominate during animation, the stats panel is updating too frequently.

**Phase relevance:** Stats panel implementation phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Project scaffolding | SSR conflicts with Three.js (#5) | Use `next/dynamic` with `ssr: false` from the start, or consider Vite |
| Data model / city generation | No reproducible seeds (#12) | Implement seeded PRNG before any algorithm work |
| Algorithm engine design | Synchronous computation blocking UI (#1) | Async generator / Web Worker architecture from day one |
| Algorithm engine design | Coupled algorithm and rendering state (#4) | Pure data snapshots, no Three.js imports in algorithm code |
| Algorithm engine design | Over-engineered interface (#8) | Implement 3 algorithms first, extract interface second |
| Algorithm interface | Unfair comparison metrics (#3) | Define step semantics and metric normalization early |
| 3D rendering layer | Memory leaks on scene updates (#2) | Centralized disposal utility, monitor `renderer.info.memory` |
| 3D rendering layer | Height field resolution (#7) | Start at 128x128, profile, provide quality toggle |
| 3D rendering layer | Frame-rate-dependent animation (#6) | Delta-time-based animation from the start |
| UI / layout | Side-by-side does not scale to 10+ (#9) | Single scene with overlays + stats table, not 10 viewports |
| UI / layout | Camera vs UI control conflicts (#13) | Clear event boundaries between canvas and HTML |
| Playback controls | Asymmetric algorithm step counts (#10) | Completion-percentage normalization, independent speed controls |
| Stats panel | DOM thrashing from rapid updates (#14) | Throttle to 2-4 Hz, use refs not state for fast values |
| Visual polish | Cities hidden by terrain (#11) | Z-offset, depth test overrides, 2D fallback view |

## Sources

- [React Three Fiber Performance Pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls)
- [Building Efficient Three.js Scenes (Codrops, Feb 2025)](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)
- [Three.js Disposal Best Practices (Forum)](https://discourse.threejs.org/t/dispose-things-correctly-in-three-js/6534)
- [Web Workers for Non-blocking UI](https://dev.to/nikhilkumaran/web-workers-for-non-blocking-user-interface-i1a)
- [Next.js "window is not defined" Solutions](https://dev.to/devin-rosario/stop-window-is-not-defined-in-nextjs-2025-394j)
- [Visualizing Algorithms (Mike Bostock)](https://bost.ocks.org/mike/algorithms/)
- [Algorithm Visualizer Journey (Sean Coughlin)](https://blog.seancoughlin.me/visualizing-the-invisible-my-journey-building-an-algorithm-visualizer)
- [TSP Heuristic Benchmarking Challenges (ACM)](https://dl.acm.org/doi/fullHtml/10.1145/3545922.3545926)
- [Rigorous TSP Heuristic Analysis (ResearchGate)](https://www.researchgate.net/publication/332327761_Rigorous_Performance_Analysis_of_State-of-the-Art_TSP_Heuristic_Solvers)
- [Three.js Animation Loop (Discover Three.js)](https://discoverthreejs.com/book/first-steps/animation-loop/)
- [Three.js Tips and Tricks (Medium)](https://medium.com/@ludivine.constanti/three-js-good-practices-f0d14136e26a)
