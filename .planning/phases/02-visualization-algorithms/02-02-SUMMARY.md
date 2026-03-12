---
phase: 02-visualization-algorithms
plan: 02
subsystem: algorithms
tags: [tsp, nearest-neighbor, greedy, 2-opt, 3-opt, simulated-annealing, genetic-algorithm, ant-colony, mst, elastic-net, gravitational, zustand]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "City type, euclideanDistance, computeIsolationWeights, computeCentroid, computeHeightField, SurfaceData, Zustand store"
provides:
  - "10 TSP algorithm implementations producing AlgoStep[] arrays"
  - "ALGORITHM_REGISTRY with ids, colors, categories"
  - "runAlgorithm dispatcher with timing"
  - "AlgorithmSlice for Zustand (results, playback state)"
affects: [02-visualization-algorithms remaining plans, 03-polish-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns: ["AlgoStep[] pre-compute-then-playback", "tourLength/tourEdges shared utilities", "algorithm registry pattern", "Zustand slice composition with algorithm results"]

key-files:
  created:
    - src/algorithms/types.ts
    - src/algorithms/tour-utils.ts
    - src/algorithms/nearest-neighbor.ts
    - src/algorithms/greedy.ts
    - src/algorithms/two-opt.ts
    - src/algorithms/three-opt.ts
    - src/algorithms/simulated-annealing.ts
    - src/algorithms/genetic-algorithm.ts
    - src/algorithms/ant-colony.ts
    - src/algorithms/christofides-like.ts
    - src/algorithms/elastic-net.ts
    - src/algorithms/gravitational.ts
    - src/algorithms/registry.ts
    - src/algorithms/runner.ts
    - src/store/algorithm-slice.ts
  modified:
    - src/store/index.ts

key-decisions:
  - "Gravitational fallback: when surface descent gets stuck, fall back to nearest-unvisited to guarantee tour completion"
  - "SA records step every 10 iterations to keep animation manageable"
  - "Elastic Net maps net nodes to cities by proximity for tour order"
  - "3-Opt limited to 3 full passes to prevent excessive step count"

patterns-established:
  - "Algorithm solve signature: (cities: City[], surfaceData?: SurfaceData) => AlgoStep[]"
  - "Registry entry pattern: id, name, category, color, description, solve, requiresSurface"
  - "Pre-compute all steps then store for playback (no real-time computation during animation)"

# Metrics
duration: 5min
completed: 2026-03-12
---

# Phase 02 Plan 02: Algorithm Engine Summary

**10 TSP algorithms (NN, Greedy, 2/3-Opt, SA, GA, ACO, MST-approx, Elastic Net, Gravitational) with registry, runner, and Zustand playback state**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-12T06:55:03Z
- **Completed:** 2026-03-12T07:00:03Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- 10 TSP algorithms all producing valid AlgoStep[] arrays with step-by-step narration
- ALGORITHM_REGISTRY with 10 entries, distinct colors, and category labels
- runAlgorithm dispatcher timing execution and returning AlgoResult
- AlgorithmSlice in Zustand store for results and playback control
- Zero rendering imports in src/algorithms/ (pure computation)

## Task Commits

Each task was committed atomically:

1. **Task 1: Algorithm types, tour utilities, and first 5 algorithms** - `a99c86a` (feat)
2. **Task 2: Remaining algorithms, registry, runner, and Zustand slice** - `b4169df` (feat)

## Files Created/Modified
- `src/algorithms/types.ts` - AlgoStep, AlgoResult, TSPAlgorithm interfaces
- `src/algorithms/tour-utils.ts` - tourLength and tourEdges utilities
- `src/algorithms/nearest-neighbor.ts` - NN construction heuristic
- `src/algorithms/greedy.ts` - Greedy edge-insertion heuristic
- `src/algorithms/two-opt.ts` - 2-Opt improvement
- `src/algorithms/three-opt.ts` - 3-Opt/Or-opt improvement (max 3 passes)
- `src/algorithms/simulated-annealing.ts` - SA with 2-opt neighborhood, NN initial tour
- `src/algorithms/genetic-algorithm.ts` - GA with OX1 crossover, tournament selection
- `src/algorithms/ant-colony.ts` - ACO with pheromone deposit/evaporation
- `src/algorithms/christofides-like.ts` - MST (Prim) + greedy matching + Euler circuit shortcutting
- `src/algorithms/elastic-net.ts` - Durbin & Willshaw deformable ring
- `src/algorithms/gravitational.ts` - Novel: steepest descent on isolation-weighted surface with well-filling
- `src/algorithms/registry.ts` - ALGORITHM_REGISTRY array (10 entries)
- `src/algorithms/runner.ts` - runAlgorithm dispatcher with performance timing
- `src/store/algorithm-slice.ts` - Zustand slice for results and playback
- `src/store/index.ts` - Updated to include AlgorithmSlice

## Decisions Made
- Gravitational algorithm uses fallback to nearest-unvisited city when surface descent gets stuck at a local minimum without finding a city. This guarantees tour completion while preserving the surface-guided approach for most cities.
- SA steps recorded every 10 iterations (not every iteration) to keep animation step count manageable.
- Elastic Net tour derived by mapping cities to nearest net nodes and sorting by net position.
- 3-Opt limited to 3 full passes as a practical tradeoff between quality and computation/step count.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed gravitational infinite loop on descent stall**
- **Found during:** Task 2 (gravitational algorithm implementation)
- **Issue:** When steepest descent reached a local minimum without a nearby city, the restart logic could loop indefinitely without adding any city to the tour.
- **Fix:** Changed else branch to always add nearest unvisited city as fallback when descent fails, guaranteeing progress.
- **Files modified:** src/algorithms/gravitational.ts
- **Verification:** All 10 algorithms complete with 10 cities in under 10ms.
- **Committed in:** b4169df (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for correctness. No scope creep.

## Issues Encountered
None beyond the gravitational infinite loop bug documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 10 algorithms ready for visualization and comparison
- AlgorithmSlice provides playback state for animation engine
- Registry provides colors for rendering
- Gravitational algorithm requires surfaceData (flagged via requiresSurface)

---
*Phase: 02-visualization-algorithms*
*Completed: 2026-03-12*
