# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-12)

**Core value:** Visualize and validate whether a gravitational centerpoint surface can produce competitive TSP tours
**Current focus:** Phase 3 - Comparison Gallery (Phase 2 complete)

## Current Position

Phase: 2 of 3 (Visualization + Algorithms) -- COMPLETE
Plan: 3 of 3 in current phase
Status: Phase complete
Last activity: 2026-03-12 — Completed 02-03-PLAN.md

Progress: [███████░░░] 71% (5/7 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 3.2 min
- Total execution time: 16 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation + Surface | 2/2 | 5 min | 2.5 min |
| 2. Visualization + Algorithms | 3/3 | 11 min | 3.7 min |

**Recent Trend:**
- Last 5 plans: 2 min, 3 min, 5 min, 3 min
- Trend: stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Static export via `output: 'export'` -- no server needed for client-only app
- All city coordinates in normalized [0,1] space -- renderers map to screen/world coords
- Pure computation modules in src/lib/ with zero rendering imports
- setCities calls recomputeSurface via get() for cross-slice sync
- Pre-compute invTwoSigmaSq outside inner loop for surface performance
- clamp01 helper ensures all city coords stay in [0,1] regardless of preset math
- Zustand slices pattern with import type for circular reference resolution
- 0.3 scale factor for vertex Z displacement keeps 3D surface proportional
- Viridis colormap with inverted domain: wells dark, ridges bright
- Dynamic import with ssr:false required for all Three.js components (even 'use client' insufficient)
- geoPath from d3-geo (not d3-geo-path) for contour rendering
- Gravitational fallback: nearest-unvisited city when surface descent stalls, guaranteeing tour completion
- SA records step every 10 iterations to keep animation step count manageable
- 3-Opt limited to 3 full passes for practical computation/step tradeoff
- Algorithm solve signature: (cities, surfaceData?) => AlgoStep[] with pre-compute-then-playback pattern
- selectedAlgoId in Zustand store for cross-component state sharing (not prop drilling)
- primitive object wrapper for Three.js Line to avoid JSX line/SVG conflict in R3F
- Delta-time accumulation in usePlayback for frame-rate-independent animation speed

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-03-12
Stopped at: Completed 02-03-PLAN.md (algorithm-to-visualization pipeline with animated playback)
Resume file: None
