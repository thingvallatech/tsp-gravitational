# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-12)

**Core value:** Visualize and validate whether a gravitational centerpoint surface can produce competitive TSP tours
**Current focus:** Phase 2 - Visualization + Algorithms

## Current Position

Phase: 2 of 3 (Visualization + Algorithms)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-03-12 — Completed 02-01-PLAN.md

Progress: [███░░░░░░░] 43% (3/7 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 2.7 min
- Total execution time: 8 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation + Surface | 2/2 | 5 min | 2.5 min |
| 2. Visualization + Algorithms | 1/3 | 3 min | 3.0 min |

**Recent Trend:**
- Last 5 plans: 3 min, 2 min, 3 min
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

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-03-12
Stopped at: Completed 02-01-PLAN.md (3D height field scene, 2D heatmap with contours)
Resume file: None
