# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-12)

**Core value:** Visualize and validate whether a gravitational centerpoint surface can produce competitive TSP tours
**Current focus:** Phase 2 - Visualization + Algorithms

## Current Position

Phase: 2 of 3 (Visualization + Algorithms)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-03-12 — Completed 02-02-PLAN.md

Progress: [████░░░░░░] 57% (4/7 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 3.3 min
- Total execution time: 13 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation + Surface | 2/2 | 5 min | 2.5 min |
| 2. Visualization + Algorithms | 2/3 | 8 min | 4.0 min |

**Recent Trend:**
- Last 5 plans: 3 min, 2 min, 3 min, 5 min
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

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-03-12
Stopped at: Completed 02-02-PLAN.md (10 TSP algorithms, registry, runner, Zustand algorithm slice)
Resume file: None
