# Requirements: TSP Gravitational Surface Solver

**Defined:** 2026-03-12
**Core Value:** Visualize and validate whether a gravitational centerpoint surface can produce competitive TSP tours

## v1 Requirements

### Visualization

- [ ] **VIZ-01**: 3D gravitational height field rendering showing wells, ridges, and drainage channels
- [ ] **VIZ-02**: 2D top-down heatmap with contour lines and tour overlay
- [ ] **VIZ-03**: Color-coded tour paths — each algorithm gets a distinct color
- [ ] **VIZ-04**: Step-by-step animation of each algorithm's tour construction
- [ ] **VIZ-05**: Step narration — text descriptions of what each algorithm is doing at each step

### Algorithms

- [ ] **ALGO-01**: 10+ TSP algorithms implemented (nearest neighbor, greedy, 2-opt, 3-opt, SA, GA, ACO, christofides-like, elastic net, gravitational centerpoint)
- [ ] **ALGO-02**: Novel gravitational centerpoint heuristic — weighted surface, centerpoint lift, drainage-based tour
- [ ] **ALGO-03**: City weighting by isolation (distance to nearest neighbor — outliers get deepest wells)
- [ ] **ALGO-04**: Synchronized playback — all algorithms animate on the same timeline

### Comparison

- [ ] **COMP-01**: Side-by-side algorithm gallery — grid layout showing all algorithms simultaneously
- [ ] **COMP-02**: Tour length + live ranking leaderboard as algorithms complete
- [ ] **COMP-03**: Computation time tracking per algorithm
- [ ] **COMP-04**: Optimality gap display — % from best-known solution
- [ ] **COMP-05**: Batch comparison across multiple random instances with aggregate stats

### Input

- [ ] **INPT-01**: Preset city configurations (random, clustered, circular, grid, star, spiral)
- [ ] **INPT-02**: Seed-based reproducibility — same seed = same layout

## v2 Requirements

### Controls

- **CTRL-01**: Parameter sliders for gravitational model (kernel width, lift height, weighting strategy)
- **CTRL-02**: Click-to-place custom cities
- **CTRL-03**: Animation speed control slider

## Out of Scope

| Feature | Reason |
|---------|--------|
| Map integration (Mapbox/deck.gl) | Cities are abstract points, not real locations |
| Code editor / custom algorithm input | Different product entirely |
| User accounts | Stateless personal tool |
| TSPLIB file import | Presets cover test cases |
| Mobile optimization | Desktop exploration tool |
| Server-side computation | All algorithms fast enough client-side for 10-50 cities |
| Exact solvers for N > 18 | Would freeze the browser |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| VIZ-01 | Phase 2 | Pending |
| VIZ-02 | Phase 2 | Pending |
| VIZ-03 | Phase 2 | Pending |
| VIZ-04 | Phase 2 | Pending |
| VIZ-05 | Phase 2 | Pending |
| ALGO-01 | Phase 2 | Pending |
| ALGO-02 | Phase 2 | Pending |
| ALGO-03 | Phase 1 | Pending |
| ALGO-04 | Phase 3 | Pending |
| COMP-01 | Phase 3 | Pending |
| COMP-02 | Phase 3 | Pending |
| COMP-03 | Phase 3 | Pending |
| COMP-04 | Phase 3 | Pending |
| COMP-05 | Phase 3 | Pending |
| INPT-01 | Phase 1 | Pending |
| INPT-02 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-03-12*
*Last updated: 2026-03-12 after roadmap creation*
