# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-12)

**Core value:** Visualize and validate whether a gravitational centerpoint surface can produce competitive TSP tours
**Current focus:** Phase 3 - Comparison Gallery (complete)

## Current Position

Phase: 3 of 3 (Gallery + Comparison)
Plan: 2 of 2 in current phase
Status: Complete
Last activity: 2026-03-12 — Completed 03-02-PLAN.md

Progress: [██████████] 100% (7/7 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 2.9 min
- Total execution time: 20 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation + Surface | 2/2 | 5 min | 2.5 min |
| 2. Visualization + Algorithms | 3/3 | 11 min | 3.7 min |
| 3. Gallery + Comparison | 2/2 | 4 min | 2.0 min |

**Recent Trend:**
- Last 5 plans: 3 min, 5 min, 3 min, 2 min, 2 min
- Trend: stable/improving

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
- Self-contained canvas in AlgoTile rather than reusing TourOverlay2D for simpler props
- setTimeout(fn, 0) batching for sequential algorithm runs without UI freeze
- Playback set to final step on Run All so completed tours display immediately
- Shared tick count normalized to 0-1 fraction for synchronized gallery playback
- Batch comparison imports generators directly instead of mutating store
- Sequential seeds (1..N) for reproducible batch comparison runs

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-12
Stopped at: Completed 03-02-PLAN.md (sync playback + batch comparison) -- all plans complete
Resume file: None
