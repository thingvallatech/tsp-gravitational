# Technology Stack

**Project:** TSP Visualization & Algorithm Explorer
**Researched:** 2026-03-12

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 16.1 | App framework, routing, static export | Latest stable. Use `output: 'export'` for fully client-side SPA -- no server needed. Turbopack dev server is fast. | HIGH |
| React | 19 | UI layer | Required by Next.js 16. Concurrent features useful for non-blocking algorithm animation. | HIGH |
| TypeScript | 5.7 (stable) | Type safety | TS 6.0 is RC, not yet stable. Stick with 5.7 for production reliability. TS 7 (Go-based) is preview-only. | HIGH |

**Why Next.js over Vite?** For a client-side-only tool, Vite would also work. Next.js wins because: (1) built-in routing for gallery/comparison pages, (2) static export means zero server cost on DO App Platform, (3) established ecosystem with R3F. If you want minimal overhead, Vite + React Router is a valid alternative -- but Next.js is the safer default.

### 3D Rendering

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Three.js | r183 (0.183.x) | 3D engine | Industry standard, 2.7M weekly npm downloads. WebGPU support with WebGL 2 fallback. Monthly releases. | HIGH |
| @react-three/fiber | 9.5 | React renderer for Three.js | Declarative Three.js in JSX. No performance overhead vs raw Three.js -- bottleneck is GPU, not React. Pairs with React 19. | HIGH |
| @react-three/drei | 10.7 | R3F helpers | OrbitControls, PerspectiveCamera, helpers out of the box. Massive timesaver for camera controls, lighting presets. | HIGH |

**Why React Three Fiber over raw Three.js?** For a React app, R3F is strictly better. It gives you declarative scene management, React state integration, and the drei helper library -- all with zero rendering overhead. Raw Three.js only makes sense if you are NOT using React.

**Height field approach:** Use `PlaneGeometry` with high subdivision (e.g., 100x100) and displace vertex positions in a `useFrame` callback or via `bufferAttribute` updates. This is the standard terrain/heightmap pattern in Three.js. Do NOT use `ParametricGeometry` (removed from Three.js core, now in examples/addons -- unnecessary complexity).

### 2D Rendering

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| HTML5 Canvas API | (native) | 2D heatmaps, contour lines, tour overlays | Direct Canvas 2D context is fastest for pixel-level heatmaps. No library overhead needed for drawing colored rectangles and lines. | HIGH |
| d3-contour | 4.x (part of D3 7.9) | Contour line generation | Marching squares algorithm, battle-tested. Import only `d3-contour` -- do NOT import all of D3. | HIGH |
| d3-scale | 4.x | Color scales, value mapping | Linear/sequential scales for heatmap coloring. Again, import only this sub-module. | HIGH |
| d3-color | 3.x | Color interpolation | Smooth color gradients for heatmaps (e.g., `d3.interpolateViridis`). | MEDIUM |
| d3-scale-chromatic | 3.x | Color schemes | Pre-built sequential/diverging palettes (Viridis, Plasma, Inferno). | MEDIUM |

**Why raw Canvas over a charting library?** Charting libraries (Recharts, Nivo, Victory) are designed for standard charts -- bar, line, scatter. A TSP heatmap with contour overlays and animated tour paths is custom rendering. Raw Canvas 2D context gives full control with no abstraction fighting. D3 sub-modules provide the math (contour generation, scales) without imposing rendering opinions.

**Why NOT full D3?** D3 v7.9 is a monolith (7.9.0, last published ~2024, stable but large). Import only the sub-packages you need: `d3-contour`, `d3-scale`, `d3-scale-chromatic`. This keeps bundle size small and avoids pulling in DOM manipulation utilities that conflict with React's model.

### Animation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| motion (Framer Motion) | 12.35 | UI transitions, panel animations | Smooth layout animations for algorithm gallery, parameter panels. Web Animations API for 120fps. | HIGH |
| requestAnimationFrame | (native) | Algorithm step animation | For algorithm visualization, you need frame-by-frame control (pause, step, speed). rAF gives precise timing control that declarative animation libs cannot. | HIGH |

**Animation architecture:** Use `motion` for UI chrome (panels sliding, cards animating). Use raw `requestAnimationFrame` loops for algorithm visualization (tour drawing, vertex updates). These are different animation domains -- do NOT try to unify them.

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zustand | 5.0.11 | Global app state | Algorithm parameters, current tour, comparison state. Minimal API, fine-grained subscriptions, works perfectly with R3F. Part of pmndrs ecosystem (same as R3F). | HIGH |

**Why Zustand over React Context?** Context causes full-tree re-renders on state change. With a 3D scene + multiple canvases, this kills performance. Zustand's `useStore(selector)` pattern gives surgical re-renders. Zustand is also the de facto state manager in the R3F ecosystem.

**Why NOT Redux/Jotai?** Redux is overkill for a personal tool. Jotai (atomic state) is fine but Zustand's single-store pattern maps better to "algorithm state" as a coherent unit.

### Controls & GUI

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| leva | 0.10.1 | Parameter sliders, debug controls | React-first GUI panel from pmndrs. Sliders, color pickers, dropdowns with zero boilerplate. Integrates natively with R3F scenes. | MEDIUM |

**Confidence note:** Leva is at 0.10.1 -- pre-1.0. It works well and is widely used in R3F projects, but API may have minor breaking changes. For production-critical controls, consider building custom slider components with Radix UI primitives. For an exploration tool, Leva is perfect.

**Alternative: Tweakpane** -- If Leva proves unstable, Tweakpane (v4) is a solid non-React alternative. Requires manual wiring to React state but is very stable.

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 4.2.0 | Utility CSS for layout, panels | v4 is stable. New CSS-first config. Fast with Turbopack. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| simplex-noise | 4.x | Noise generation | If generating procedural test city distributions | MEDIUM |
| mathjs | 13.x | Matrix operations | Only if implementing Lin-Kernighan or other matrix-heavy algorithms | LOW |
| web-worker | (native API) | Background computation | Move heavy TSP solvers (genetic algorithm, simulated annealing) off main thread to keep UI responsive | HIGH |

### Dev Tools

| Tool | Version | Purpose | Confidence |
|------|---------|---------|------------|
| ESLint | 9.x | Linting | HIGH |
| Prettier | 3.x | Formatting | HIGH |
| @react-three/test-renderer | latest | R3F testing | MEDIUM |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| 3D Engine | Three.js via R3F | Babylon.js | 100x fewer npm downloads. Smaller ecosystem, fewer React integrations. Overkill physics engine for height fields. |
| 3D Engine | Three.js via R3F | Raw WebGL/WebGPU | Enormous implementation effort for camera controls, lighting, mesh management. Three.js abstracts this. |
| 3D Wrapper | @react-three/fiber | react-three-renderer | Unmaintained. R3F is the standard. |
| 2D Rendering | Canvas 2D + d3 modules | SVG + D3 | SVG DOM nodes choke at ~1000 elements. Heatmaps need per-pixel rendering. Canvas is 10x faster for this use case. |
| 2D Rendering | Canvas 2D + d3 modules | PixiJS | PixiJS is a game engine. Overkill for heatmaps and line overlays. Adds bundle weight for no benefit. |
| 2D Rendering | Canvas 2D + d3 modules | WebGL 2D (via Three.js) | Could render 2D in the 3D scene, but separating concerns (3D scene vs 2D overlay) is cleaner and simpler to debug. |
| State | Zustand | Redux Toolkit | Boilerplate-heavy for a personal tool. No benefit for this scale. |
| State | Zustand | Jotai | Fine option, but single-store Zustand maps better to algorithm state as a unit. |
| Framework | Next.js 16.1 | Vite + React Router | Valid alternative. Next.js wins on routing conventions and static export story. |
| Controls | Leva | dat.GUI | Unmaintained, not React-aware. |
| Controls | Leva | Tweakpane | Good fallback if Leva is unstable. Not React-native. |
| Animation | motion 12 | GSAP | GSAP is powerful but license-restricted for some uses. Motion is open source and React-native. |
| Animation | motion 12 | react-spring | React-spring is fine but Motion has broader adoption and better docs in 2026. |

## Installation

```bash
# Core framework
npm install next@latest react@latest react-dom@latest

# 3D rendering
npm install three @react-three/fiber @react-three/drei

# 2D rendering (D3 sub-modules only)
npm install d3-contour d3-scale d3-scale-chromatic d3-color

# State management
npm install zustand

# Controls
npm install leva

# Animation
npm install motion

# Styling
npm install tailwindcss @tailwindcss/postcss

# Dev dependencies
npm install -D typescript @types/react @types/react-dom @types/three @types/d3-contour @types/d3-scale @types/d3-scale-chromatic @types/d3-color eslint prettier
```

## Version Pinning Strategy

Pin major versions, allow patch updates:

```json
{
  "dependencies": {
    "next": "^16.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "three": "^0.183.0",
    "@react-three/fiber": "^9.5.0",
    "@react-three/drei": "^10.7.0",
    "d3-contour": "^4.0.0",
    "d3-scale": "^4.0.0",
    "d3-scale-chromatic": "^3.0.0",
    "d3-color": "^3.0.0",
    "zustand": "^5.0.0",
    "leva": "^0.10.0",
    "motion": "^12.0.0",
    "tailwindcss": "^4.2.0"
  }
}
```

**Note on Three.js versioning:** Three.js uses 0.x versioning (r183 = 0.183.x). Every release can contain breaking changes. Pin to `^0.183.0` and update deliberately. R3F and Drei track Three.js versions -- update them together.

## Architecture Notes for Stack

### Rendering Pipeline

```
Zustand Store (algorithm state, parameters)
    |
    +---> React Three Fiber Scene (3D height field)
    |         - PlaneGeometry with vertex displacement
    |         - OrbitControls for camera
    |         - Lighting for depth perception
    |
    +---> Canvas 2D Component (2D overlay)
    |         - d3-contour for contour lines
    |         - d3-scale for color mapping
    |         - Raw canvas for heatmap pixels
    |         - Animated tour path drawing
    |
    +---> Leva Panel (parameter controls)
    |         - Algorithm selection
    |         - Temperature, cooling rate, etc.
    |         - City count slider
    |
    +---> Motion-animated UI (gallery, comparison)
              - Algorithm cards
              - Side-by-side layouts
```

### Web Worker Pattern for Heavy Computation

```typescript
// solver.worker.ts -- runs off main thread
// Genetic algorithm, simulated annealing, branch & bound
// Posts intermediate results back for animation

// main thread subscribes to worker messages
// updates Zustand store with each step
// R3F and Canvas components re-render from store
```

This keeps 60fps rendering while solving. Critical for algorithms that take seconds to converge.

## Sources

- [Three.js Releases](https://github.com/mrdoob/three.js/releases) -- r183, active development
- [Three.js 2026 WebGPU Status](https://www.utsubo.com/blog/threejs-2026-what-changed) -- WebGPU production-ready
- [Next.js 16 Blog](https://nextjs.org/blog/next-16) -- v16.1 stable
- [React Three Fiber npm](https://www.npmjs.com/package/@react-three/fiber) -- v9.5.0
- [Drei npm](https://www.npmjs.com/package/@react-three/drei) -- v10.7.7
- [Zustand npm](https://www.npmjs.com/package/zustand) -- v5.0.11
- [Motion Changelog](https://motion.dev/changelog) -- v12.35.x
- [Leva GitHub](https://github.com/pmndrs/leva) -- v0.10.1
- [D3 npm](https://www.npmjs.com/package/d3) -- v7.9.0 (use sub-modules)
- [d3-contour Documentation](https://d3js.org/d3-contour) -- marching squares
- [Tailwind CSS v4.2](https://tailwindcss.com/blog) -- v4.2.0
- [TypeScript 6.0 RC Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-rc/) -- use 5.7 stable
- [R3F Terrain Generation](https://nitinchotia.medium.com/exploring-procedural-terrain-generation-with-react-three-fiber-and-noise-js-2bfbde635378) -- heightmap pattern
- [R3F Scaling Performance](https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance) -- GPU-bottlenecked, not React
