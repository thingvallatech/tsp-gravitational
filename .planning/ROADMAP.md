# Roadmap: TSP Gravitational Surface Solver

## Overview

This roadmap delivers a client-side TSP visualization tool in three phases: first the data foundation (city generation, surface computation, store), then the core visualization and algorithm engine (3D/2D rendering, gravitational heuristic, classical algorithms, animation), and finally the comparison gallery (side-by-side layout, stats, batch runs). The phases follow the dependency graph -- data layer feeds visualization, visualization feeds comparison.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation + Surface** - Data layer, city generation, gravitational surface computation
- [ ] **Phase 2: Visualization + Algorithms** - 3D/2D rendering, algorithm engine, animation
- [ ] **Phase 3: Gallery + Comparison** - Side-by-side comparison, stats, batch runs

## Phase Details

### Phase 1: Foundation + Surface
**Goal**: Users can generate city configurations and see the gravitational surface computed from them
**Depends on**: Nothing (first phase)
**Requirements**: INPT-01, INPT-02, ALGO-03
**Success Criteria** (what must be TRUE):
  1. User can select from preset city configurations (random, clustered, circular, grid, star, spiral) and see cities placed on screen
  2. User can enter a seed value and get the same city layout every time for that seed
  3. Gravitational surface is computed from city positions with isolation-weighted wells (outlier cities produce deeper wells)
  4. Zustand store holds city data and surface data, ready for consumption by renderers
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffolding, core types, PRNG, and math utilities
- [x] 01-02-PLAN.md — City preset generators, surface computation, and Zustand store

### Phase 2: Visualization + Algorithms
**Goal**: Users can see the gravitational surface in 3D and 2D, run TSP algorithms including the novel gravitational heuristic, and watch animated step-by-step tour construction
**Depends on**: Phase 1
**Requirements**: VIZ-01, VIZ-02, VIZ-03, VIZ-04, VIZ-05, ALGO-01, ALGO-02
**Success Criteria** (what must be TRUE):
  1. User sees a 3D rendered height field with gravitational wells at city locations, ridges between clusters, and can orbit/zoom the camera
  2. User sees a 2D top-down heatmap with contour lines and the computed tour drawn on top
  3. User can run any of 10+ TSP algorithms and watch the tour build step-by-step with play/pause controls
  4. Each algorithm's tour is drawn in a distinct color so tours are visually distinguishable
  5. Each animation step shows a text narration describing what the algorithm is doing (e.g., "Nearest Neighbor: connecting city 4 to city 7, distance 12.3")
**Plans**: TBD

Plans:
- [ ] 02-01: 3D height field and 2D heatmap rendering
- [ ] 02-02: Algorithm engine with Web Workers and first algorithms
- [ ] 02-03: Animation playback and step narration

### Phase 3: Gallery + Comparison
**Goal**: Users can compare all algorithms side-by-side with live stats and run batch comparisons across multiple random instances
**Depends on**: Phase 2
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, ALGO-04
**Success Criteria** (what must be TRUE):
  1. User sees all algorithms displayed simultaneously in a grid gallery, each with its own tour visualization
  2. A live leaderboard ranks algorithms by tour length as they complete, updating in real time
  3. User can see computation time and optimality gap (% from best) for each algorithm
  4. User can run batch comparison across multiple random city instances and see aggregate statistics (average tour length, win rate, consistency)
  5. All algorithms animate on the same synchronized timeline so the user can compare progress at the same point in execution
**Plans**: TBD

Plans:
- [ ] 03-01: Gallery layout and stats panel
- [ ] 03-02: Synchronized playback and batch comparison

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + Surface | 2/2 | ✓ Complete | 2026-03-12 |
| 2. Visualization + Algorithms | 0/3 | Not started | - |
| 3. Gallery + Comparison | 0/2 | Not started | - |
