# Project Research Summary

**Project:** TSP Gravitational Surface Solver & Algorithm Comparison Tool
**Domain:** Interactive algorithm visualization with 3D rendering
**Researched:** 2026-03-12
**Confidence:** HIGH

## Executive Summary

This project is a client-side TSP algorithm visualization tool that differentiates itself through a novel 3D gravitational height field surface and a custom gravitational centerpoint heuristic. The established way to build this is a React SPA with Three.js for 3D rendering, Canvas 2D for heatmaps and tour overlays, and Web Workers for algorithm computation. The tech ecosystem is mature -- React Three Fiber, Zustand, and D3 sub-modules are the standard choices and all have high adoption. Next.js with static export provides routing without server costs.

The recommended approach is a layered architecture with strict separation between algorithm computation (pure TypeScript, runs in Web Workers) and visualization (R3F for 3D, Canvas for 2D). Algorithms produce step-by-step data snapshots; renderers consume them via a Zustand state store. This "pre-compute then playback" pattern is the single most important architectural decision -- it enables pause, rewind, speed control, and fair side-by-side comparison. Build the data types and algorithm engine first, then visualization, then the gallery comparison UI.

The key risks are: (1) main-thread blocking from synchronous algorithm execution, which must be prevented by designing the async/worker architecture from day one -- retrofitting is a rewrite; (2) Three.js GPU memory leaks on scene updates, which require explicit disposal patterns built into the rendering layer from the start; (3) unfair algorithm comparison from inconsistent step/metric definitions, which must be standardized before implementing individual algorithms. All three risks are preventable with upfront architecture work, not afterthoughts.

## Key Findings

### Recommended Stack

The stack is entirely client-side with no backend required. Next.js 16.1 with static export provides the app shell and routing. React Three Fiber (v9.5) with drei helpers is the standard way to do Three.js in React -- it provides declarative scene management, automatic GPU resource cleanup, and the same ecosystem as Zustand. For 2D rendering, raw Canvas 2D with D3 sub-modules (d3-contour, d3-scale, d3-scale-chromatic) gives full control over heatmaps and contour lines without library overhead. See STACK.md for full details.

**Core technologies:**
- **Next.js 16.1 + React 19**: App framework with static export -- zero server cost on DO App Platform
- **Three.js r183 via React Three Fiber 9.5**: 3D gravitational surface rendering with declarative React integration
- **Canvas 2D + D3 sub-modules**: 2D heatmaps, contour lines, and tour path overlays with pixel-level control
- **Zustand 5.0**: Global state store bridging algorithms and renderers -- fine-grained subscriptions prevent re-render cascades
- **Web Workers**: Off-main-thread algorithm execution to maintain 60fps during computation
- **Leva 0.10**: Parameter controls for gravitational model tuning (pre-1.0 but stable for this use case)
- **Tailwind CSS 4.2 + Motion 12**: Styling and UI animations

### Expected Features

The existing TSP visualizer landscape (tspvis.com, VisuAlgo, stemlounge.com) sets clear user expectations. See FEATURES.md for full analysis.

**Must have (table stakes):**
- Click-to-place and random city generation (10-50 cities)
- Run algorithm and display color-coded tour result
- Step-by-step animation with play/pause/speed controls
- Tour length display, updated in real-time
- Multiple algorithms (10+ is the stated goal)
- Clear/reset functionality

**Should have (differentiators -- these ARE the project):**
- 3D gravitational height field surface (the signature visual, no competitor has this)
- Novel gravitational centerpoint heuristic (original algorithm contribution)
- Side-by-side algorithm comparison with live ranking leaderboard
- Parameter controls for gravitational model (kernel width, decay, lift)
- Preset city configurations (clustered, circular, grid) to expose algorithm strengths/weaknesses
- Computation time tracking alongside tour quality

**Defer (v2+):**
- Full 10+ algorithm suite (start with 3-4, add incrementally)
- Synchronized animation playback across algorithms (requires normalizing incompatible step counts)
- Step narration / educational text per algorithm step
- Optimality gap display (requires brute-force baseline or known-optimal lookup)

**Anti-features (do NOT build):**
- Real-world map integration (Mapbox/deck.gl adds massive complexity for zero value)
- Code editor / custom algorithm input (different product entirely)
- User accounts, server-side computation, mobile-first design

### Architecture Approach

A four-layer architecture: Data/Solver Layer (pure TypeScript algorithms + city generation + surface computation), State Layer (Zustand store as the single source of truth), Visualization Layer (R3F 3D scene + Canvas 2D overlays), and UI Shell (Next.js pages, parameter panels, gallery layout). The critical boundary is between algorithms and renderers -- they never reference each other, communicating only through typed data snapshots in the state store. See ARCHITECTURE.md for component details and data flow diagrams.

**Major components:**
1. **Algorithm Runner + Web Workers** -- Executes TSP algorithms off-thread, produces AlgoStep[] snapshots
2. **SurfaceComputer** -- Evaluates h(x,y) gravitational potential field, outputs Float32Array grid
3. **HeightFieldMesh (R3F)** -- Renders 3D surface from height data via PlaneGeometry vertex displacement
4. **HeatmapRenderer + ContourRenderer (Canvas 2D)** -- 2D top-down visualization with d3-contour overlays
5. **AnimationController** -- Manages playback state, advances step indices, handles speed/pause
6. **AlgoCard + GalleryLayout** -- Per-algorithm visualization cards with selective Zustand subscriptions
7. **ScoringEngine** -- Computes tour length, ranks algorithms, calculates comparison metrics

### Critical Pitfalls

The top 5 pitfalls from PITFALLS.md, ordered by impact:

1. **Main-thread blocking from synchronous algorithms** -- Design async generator / Web Worker architecture from day one. Never write a synchronous solve loop. This is unfixable without a rewrite if gotten wrong.
2. **Coupled algorithm and rendering state** -- Algorithms must be pure functions producing data snapshots, with zero Three.js/DOM imports. If any algorithm file imports a rendering module, the architecture is broken.
3. **Three.js GPU memory leaks** -- Explicitly dispose geometries, materials, and textures on scene updates. Monitor `renderer.info.memory` during development. R3F helps but does not fully solve this.
4. **Unfair algorithm comparison metrics** -- Define what "one step" means for each algorithm category before implementation. Show algorithm category labels. Normalize by completion percentage, not raw step count.
5. **Next.js SSR conflicts with Three.js** -- Use `next/dynamic` with `{ ssr: false }` for all Three.js components. Set up the dynamic import boundary during scaffolding, not later.

## Implications for Roadmap

Based on research, here is the suggested phase structure. The ordering follows the dependency graph from ARCHITECTURE.md and avoids the critical pitfalls identified in PITFALLS.md.

### Phase 1: Foundation and Data Layer
**Rationale:** Everything depends on TypeScript types, city generation, and the Zustand store structure. The algorithm interface must be defined here (but kept minimal -- implement 3 algorithms before extracting a generic interface per Pitfall #8).
**Delivers:** Project scaffolding (Next.js + Tailwind + R3F configured), TypeScript type definitions (City, Tour, AlgoStep, SurfaceParams), seeded city generator with presets, gravitational surface computation (Float32Array output), Zustand store skeleton.
**Addresses:** City placement, random generation, reproducible seeds, surface computation.
**Avoids:** Pitfall #5 (SSR conflicts -- set up dynamic import boundaries now), Pitfall #12 (seedless randomness), Pitfall #8 (start with concrete implementations, not abstract interfaces).

### Phase 2: 3D Visualization
**Rationale:** The gravitational height field is the project's signature feature and reason to exist. Building it early validates the visual concept and surfaces any Three.js performance issues before the algorithm complexity is layered on.
**Delivers:** R3F scene with PlaneGeometry height field mesh, vertex coloring for elevation, OrbitControls camera, city markers on surface, 2D heatmap and contour overlay (Canvas + d3-contour).
**Addresses:** 3D gravitational height field (key differentiator), 2D heatmap view.
**Avoids:** Pitfall #2 (memory leaks -- build disposal patterns into the rendering layer from the start), Pitfall #7 (height field resolution -- start at 128x128, profile), Pitfall #11 (city occlusion -- Z-offset markers).

### Phase 3: Algorithm Engine
**Rationale:** Can be built in parallel with Phase 2 since algorithms and visualization communicate only through the Zustand store. Start with 3 concrete algorithms (nearest neighbor, greedy, 2-opt) to validate the step-based interface before scaling to 10+.
**Delivers:** Algorithm runner with Web Worker infrastructure, step-based protocol (AlgoStep[]), first 3 algorithms implemented, pre-compute-then-playback pattern working end-to-end.
**Addresses:** Multiple algorithms, algorithm execution, step recording.
**Avoids:** Pitfall #1 (main-thread blocking -- Web Workers from day one), Pitfall #4 (coupled state -- pure data snapshots only), Pitfall #3 (unfair comparison -- define metrics now).

### Phase 4: Animation and Playback
**Rationale:** Depends on both visualization (Phase 2) and algorithm output (Phase 3). This connects algorithms to renderers through the animation controller.
**Delivers:** Play/pause/step-forward/step-back controls, speed slider, animated tour drawing on 2D canvas, animated 3D tour path on surface, delta-time-based animation timing.
**Addresses:** Step-by-step animation (table stakes), animation speed control, tour visualization.
**Avoids:** Pitfall #6 (frame-rate-dependent timing -- use delta-time from the start), Pitfall #10 (asymmetric step counts -- normalize by completion percentage).

### Phase 5: Gallery and Comparison
**Rationale:** Requires working algorithms with animation. This is where the side-by-side comparison value proposition comes together.
**Delivers:** AlgoCard component with per-algorithm Canvas, gallery grid layout, scoring engine with rankings, stats panel with tour length / time / rank, side-by-side comparison mode.
**Addresses:** Side-by-side comparison (differentiator), live ranking leaderboard, computation time tracking, visual tour differentiation.
**Avoids:** Pitfall #9 (layout that doesn't scale -- use 2D canvases for cards, single 3D scene for hero view, stats table for 10+), Pitfall #14 (stats panel DOM thrashing -- throttle to 2-4 Hz).

### Phase 6: Extended Algorithms and Gravitational Heuristic
**Rationale:** With the pluggable algorithm engine proven, adding algorithms is incremental. The gravitational centerpoint heuristic is the novel contribution and should be implemented with its parameter controls here.
**Delivers:** Remaining algorithms (simulated annealing, genetic algorithm, ACO, 3-opt, Christofides-like, elastic net), gravitational centerpoint heuristic, parameter panel (Leva) for gravitational model tuning.
**Addresses:** Full algorithm suite, novel heuristic, parameter exploration.
**Avoids:** Pitfall #8 (overengineered interface -- by now, the interface is proven with 3+ algorithms).

### Phase 7: Polish and Optimization
**Rationale:** Final pass after core functionality is complete.
**Delivers:** View toggle (3D/2D/split), preset city configurations (spiral, star), optimality gap display, performance optimization, responsive layout tuning, URL-based state sharing.
**Addresses:** Remaining differentiators, polish features.

### Phase Ordering Rationale

- **Phase 1 first** because every other phase depends on types, store structure, and city generation.
- **Phases 2 and 3 can run in parallel** -- this is the primary architectural win. Algorithms produce data, visualization consumes it, and the store (from Phase 1) bridges them.
- **Phase 4 after 2+3** because animation connects algorithms to renderers.
- **Phase 5 after 4** because comparison requires working animated algorithms.
- **Phase 6 is incremental** -- each new algorithm is an isolated addition to a proven framework.
- **Phase 7 is pure polish** and can be scoped to available time.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (3D Visualization):** Vertex displacement vs shader-based height field rendering needs prototyping. GPU memory management patterns for R3F need validation. Research the exact drei components needed.
- **Phase 3 (Algorithm Engine):** Web Worker communication pattern (comlink vs raw postMessage) needs benchmarking for step-heavy algorithms. The step-based protocol needs validation against real algorithm structures.
- **Phase 6 (Gravitational Heuristic):** The novel algorithm itself is research -- no existing documentation. Surface computation parameters (kernel width, decay function) need experimentation.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Next.js + Zustand + TypeScript scaffolding is thoroughly documented.
- **Phase 4 (Animation):** requestAnimationFrame playback with delta-time is a well-established pattern.
- **Phase 5 (Gallery):** React component grid with selective subscriptions is standard React.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies are mature, well-documented, and widely adopted. Versions verified against npm/official sources. Only Leva (pre-1.0) is a minor risk. |
| Features | HIGH | Multiple existing TSP visualizers surveyed (tspvis.com, VisuAlgo, stemlounge.com, pmaitland). Clear consensus on table stakes. Differentiators are well-defined. |
| Architecture | HIGH | Layered architecture with Zustand state bridge is the standard R3F pattern. Pre-compute-then-playback is proven in algorithm visualizers. Web Worker pattern is well-documented. |
| Pitfalls | HIGH | Pitfalls drawn from Three.js documentation, R3F known issues, and real-world TSP visualizer post-mortems. All have concrete prevention strategies. |

**Overall confidence:** HIGH

### Gaps to Address

- **Gravitational centerpoint heuristic algorithm design:** No external documentation exists for this novel algorithm. The surface computation formula and drainage-path logic need to be designed and validated during Phase 6. This is the primary unknown.
- **Comlink vs raw postMessage performance:** The research recommends comlink for ergonomic Worker communication, but step-heavy algorithms (SA with 10K iterations) may have overhead from comlink's proxy pattern. Benchmark during Phase 3.
- **Height field rendering approach:** Vertex displacement on CPU vs GPU shader displacement -- the research recommends starting with CPU vertex displacement (simpler, sufficient for 128x128) but a shader approach may be needed for higher resolutions or real-time parameter updates. Validate during Phase 2.
- **Gallery scaling beyond 10 algorithms:** The architecture recommends 2D canvases (not 3D) for gallery cards, but 10+ simultaneous canvas redraws at 60fps needs profiling. May need dirty-flag optimization or virtualization.
- **Leva stability:** Pre-1.0 library. If it proves unstable, fall back to Tweakpane or custom Radix UI controls. Low risk but worth noting.

## Sources

### Primary (HIGH confidence)
- [Three.js GitHub Releases](https://github.com/mrdoob/three.js/releases) -- r183 version, WebGPU status
- [React Three Fiber docs](https://r3f.docs.pmnd.rs/) -- Architecture patterns, performance, pitfalls
- [Next.js 16 blog](https://nextjs.org/blog/next-16) -- Static export, Turbopack
- [Zustand npm](https://www.npmjs.com/package/zustand) -- v5.0.11, API patterns
- [R3F Performance Pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls) -- Memory leaks, disposal
- [Three.js Disposal Guide](https://discourse.threejs.org/t/dispose-things-correctly-in-three-js/6534)

### Secondary (MEDIUM confidence)
- [tspvis.com / jhackshaw/tspvis](https://github.com/jhackshaw/tspvis) -- Reference TSP visualizer architecture
- [StemLounge TSP algorithms survey](https://stemlounge.com/animated-algorithms-for-the-traveling-salesman-problem/) -- Algorithm coverage and animation patterns
- [VisuAlgo TSP](https://visualgo.net/en/tsp) -- Animation control UX patterns
- [Zustand vs Jotai performance guide](https://www.reactlibraries.com/blog/zustand-vs-jotai-vs-valtio-performance-guide-2025) -- State management comparison
- [Visualizing Algorithms (Mike Bostock)](https://bost.ocks.org/mike/algorithms/) -- Algorithm visualization principles

### Tertiary (LOW confidence)
- [TSP Heuristic Benchmarking (ACM)](https://dl.acm.org/doi/fullHtml/10.1145/3545922.3545926) -- Fair comparison methodology
- [Rigorous TSP Heuristic Analysis (ResearchGate)](https://www.researchgate.net/publication/332327761) -- Performance analysis approaches

---
*Research completed: 2026-03-12*
*Ready for roadmap: yes*
