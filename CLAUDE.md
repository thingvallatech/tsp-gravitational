# TSP Gravitational Surface Solver

## What This Is
A visual, interactive TSP solver exploring a novel "gravitational centerpoint" heuristic alongside classical algorithms. Web-based with animated visualizations.

## Tech Stack
- TypeScript, Next.js (App Router)
- Three.js for 3D surface rendering
- HTML Canvas for 2D overlays and algorithm animations
- No backend needed — all computation client-side

## Key Commands
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run lint` — lint check

## Architecture
- `/src/app` — Next.js pages
- `/src/algorithms` — TSP solver implementations
- `/src/visualization` — 3D surface, 2D canvas, animation engine
- `/src/lib` — shared types, city generation, scoring utilities
