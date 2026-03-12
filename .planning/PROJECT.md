# TSP Gravitational Surface Solver

## What This Is

A visual exploration tool for a novel TSP heuristic based on gravitational physics. Cities are treated as weighted masses on a 2D surface. The surface is "lifted" from the geometric centerpoint, and gravity creates natural drainage channels between the weighted wells — those channels form the tour. The tool visualizes this approach with both a 3D rendered height field and a 2D heatmap overlay, and compares it side-by-side against a gallery of classical TSP algorithms with step-by-step animation and a full stats panel.

## Core Value

Visualize and validate whether a gravitational centerpoint surface can produce competitive TSP tours — make the physics intuition tangible and measurable.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Gravitational centerpoint TSP algorithm with weighted surface construction
- [ ] City weighting by isolation (distance to nearest neighbor) — outliers get deepest wells
- [ ] 3D rendered height field showing wells, ridges, and drainage channels
- [ ] 2D top-down heatmap with contour lines and tour overlay
- [ ] Gallery of classical TSP algorithms for side-by-side comparison
- [ ] Step-by-step animation of each algorithm's tour construction
- [ ] Preset city configurations (random, clustered, circular, grid, etc.)
- [ ] Parameter controls (kernel width, lift height, weighting strategy)
- [ ] Full stats panel: tour length, % from best, computation time, ranking
- [ ] Batch comparison across multiple random instances

### Out of Scope

- Custom city placement via click — preset + tweak is sufficient for exploration
- Backend/server — all computation is client-side
- TSPLIB file import — manual presets cover the test cases needed
- Mobile optimization — desktop exploration tool
- Deployment/hosting — local dev is fine

## Context

The gravitational centerpoint approach is a novel synthesis of several ideas:
- **Centerpoint theorem** (computational geometry): guarantees a balanced partition point exists for any point set
- **Cluster-then-route** (established TSP heuristic): partition, solve sub-problems, reconnect
- **N-body / gravitational models**: cities as masses with attractive forces
- **Watershed/drainage**: topographic surfaces naturally create non-crossing connectivity graphs

The key novelty is the **weighting strategy**: cities that are farthest from their nearest neighbor (outliers, the "expensive" ones) get the heaviest weight, creating deeper gravitational wells. This makes the surface naturally prioritize routing toward hard-to-reach cities — the tour is pulled toward the expensive connections first.

The height field is:
```
h(x,y) = α · dist(x,y, centerpoint) - Σ wᵢ · G(dist(x,y, cityᵢ))
```
Where G is a kernel (Gaussian or inverse-distance), wᵢ is the isolation weight, and α controls the lift.

Classical algorithms to compare against (gallery): nearest neighbor, greedy, 2-opt, 3-opt, simulated annealing, genetic algorithm, ant colony, christofides-like, elastic net, and the gravitational approach itself.

## Constraints

- **Scale**: 10-50 cities — focus on understanding behavior, not performance at scale
- **Tech**: TypeScript + Next.js, Three.js for 3D, Canvas for 2D — client-side only
- **Purpose**: Personal exploration tool, not production software

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Weight by isolation (nearest-neighbor distance) | Outlier cities are most expensive to route; deeper wells pull the tour toward them | — Pending |
| Both 3D + 2D views | 3D for intuition ("see the surface"), 2D for practical comparison | — Pending |
| Gallery of all algorithms | Comprehensive comparison to see where gravitational approach sits | — Pending |
| 10-50 cities | Small enough to visually understand, large enough to be meaningful | — Pending |
| Client-side only | No server complexity, instant iteration | — Pending |

---
*Last updated: 2026-03-12 after initialization*
