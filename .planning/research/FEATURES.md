# Feature Landscape

**Domain:** TSP Algorithm Visualization / Solver Comparison Tool
**Researched:** 2026-03-12

## Table Stakes

Features users expect from any TSP visualization tool. Missing any of these and the tool feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Click-to-place cities** | Every TSP visualizer lets you place cities on a 2D canvas. Users expect direct manipulation. | Low | Also support drag-to-reposition |
| **Random city generation** | Users want instant test cases without manual placement. Slider for count (10-50). | Low | Seed-based for reproducibility is a nice touch |
| **Run algorithm and see result** | The fundamental value proposition. Click "solve" and see the tour drawn. | Medium | Must work for all implemented algorithms |
| **Step-by-step animation** | VisuAlgo, tspvis.com, and every serious algorithm visualizer supports this. Users expect to watch the algorithm think. | Medium | Play/pause/step-forward/step-back controls are standard (see VisuAlgo keyboard shortcuts, pmaitland's 5-button control bar) |
| **Animation speed control** | Standard in VisuAlgo (+/- keys), Algorithm Visualizer (bottom panel slider), and SA visualizers. Users will want to slow down interesting parts and speed through boring ones. | Low | Slider or discrete speed settings |
| **Tour length display** | The primary metric. Every TSP tool shows this. Without it, users can't evaluate solutions. | Low | Update in real-time during animation |
| **Clear/reset** | Users need to start over. Every interactive tool has this. | Low | Clear cities, clear tours, or both |
| **Multiple algorithms** | The project's core premise. tspvis.com offers ~10, stemlounge.com covers 11. Users comparing algorithms expect breadth. | High | 10+ algorithms is the stated goal; each needs correct implementation |
| **Visual differentiation of tours** | When comparing algorithms, tours need distinct colors or visual treatment. Without this, comparison is meaningless. | Low | Color-coded paths per algorithm |
| **Responsive canvas** | Canvas should fill available space and handle window resizing. Standard web expectation. | Low | Handle resize events, maintain aspect ratio |

## Differentiators

Features that set this project apart from existing TSP visualizers. These are the "wow" moments.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **3D gravitational height field** | The signature feature. No existing TSP visualizer renders a 3D potential surface. This is novel and visually striking. Renders the "gravitational pull" of cities as a terrain. | High | Three.js/WebGL required. This IS the project's reason to exist. |
| **Novel gravitational centerpoint heuristic** | An original algorithm, not just another implementation of known heuristics. Users get to see something they can't find elsewhere. | High | The algorithm itself is the research contribution |
| **Side-by-side algorithm comparison** | Most tools run one algorithm at a time (tspvis.com chains them sequentially). Simultaneous visual comparison on the same city set is rare and powerful. | Medium | Split-pane or grid layout showing all algorithms at once |
| **Live ranking leaderboard** | As algorithms complete (or during animation), a real-time ranking by tour length. No existing tool does this well -- most just show one result at a time. | Medium | Sortable by tour length, computation time, or optimality gap |
| **Computation time tracking** | Beyond tour length, showing wall-clock time lets users understand the quality-vs-speed tradeoff. Some tools show this but it's not standard. | Low | Use performance.now(), display in stats panel |
| **Preset city configurations** | Beyond "random": clustered, circular, grid, star, spiral. These expose algorithmic strengths/weaknesses in ways random placement doesn't. Most tools only offer random. | Low | Each preset demonstrates different algorithm behaviors |
| **Parameter controls for gravitational model** | Tuning gravity constant, decay function, resolution -- letting users explore HOW the heuristic works, not just its output. Interactive parameter exploration. | Medium | Sliders with real-time 3D surface update |
| **Synchronized animation playback** | All algorithms animate simultaneously on the same timeline, so you can see which algorithm "discovers" good edges first. | High | Requires normalizing different algorithms' step counts to a common timeline |
| **Algorithm step narration** | Text descriptions of what each algorithm is doing at each step ("Nearest Neighbor: visiting city 7, distance 14.2"). Educational value. pmaitland's tool has a step log. | Medium | Per-algorithm step log or tooltip |
| **Optimality gap display** | Show how far each heuristic is from the best-known solution (or brute-force optimal for small N). This is the key metric for algorithm quality. | Low | Requires computing or knowing optimal; feasible for N <= ~20 |

## Anti-Features

Features to deliberately NOT build. Common in the domain but wrong for this project.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Real-world map integration** | tspvis.com uses Mapbox/deck.gl for geographic visualization. This adds massive complexity (map tiles, geo-projection, API keys) for zero benefit in an algorithm comparison tool. Cities are abstract points, not real locations. | Use a clean 2D canvas. The 3D is for the height field, not geography. |
| **Code editor / custom algorithm input** | Algorithm Visualizer lets users write code. This is a totally different product (IDE + visualizer). Scope explosion. | Pre-built algorithms only. The value is comparison, not authoring. |
| **User accounts / progress tracking** | VisuAlgo has login, quizzes, difficulty levels. This is an educational platform feature. Overkill for a personal exploration tool. | Stateless. No auth. Optionally persist state in URL params or localStorage. |
| **TSPlib file import/export** | Some tools support .tsp file format. Niche feature for benchmarking researchers, not casual explorers. | Presets and click-to-place are sufficient for 10-50 cities. |
| **Exact solvers for large N** | Brute force / branch-and-bound for N > 20 will freeze the browser. Don't promise optimal solutions at scale. | Cap exact solvers at N <= 15-18. For larger N, only run heuristics. Clearly communicate this limit. |
| **Mobile-first design** | A 3D height field + side-by-side comparison + stats panel needs screen real estate. Trying to make this work on phones will compromise the desktop experience. | Desktop-first. Ensure it doesn't break on tablet, but don't optimize for phone. |
| **Server-side computation** | Some tools offload solving to a backend. For 10-50 cities, all algorithms run in milliseconds to seconds in the browser. Adding a server adds deployment complexity for no benefit. | Client-side only. Use Web Workers for algorithms that might take > 100ms. |
| **Collaborative / multiplayer** | No one needs to solve TSP together in real-time. | Single user, local state. |

## Feature Dependencies

```
City Placement (click/random/presets)
  |
  +---> Algorithm Execution Engine
  |       |
  |       +---> Step-by-step Animation System
  |       |       |
  |       |       +---> Animation Controls (play/pause/speed)
  |       |       +---> Synchronized Playback (all algos in parallel)
  |       |       +---> Step Narration
  |       |
  |       +---> Stats Collection (tour length, time)
  |               |
  |               +---> Ranking Leaderboard
  |               +---> Optimality Gap
  |
  +---> 2D Canvas Rendering
  |       |
  |       +---> Tour Visualization (color-coded paths)
  |       +---> Side-by-Side Layout
  |
  +---> 3D Height Field (gravitational surface)
          |
          +---> Parameter Controls (gravity, decay)
          +---> Gravitational Heuristic Algorithm
```

Key dependency chains:

1. **City placement** is the root -- nothing works without cities on canvas
2. **Algorithm execution engine** is the core -- must support pluggable algorithms with step-by-step yielding
3. **Animation system** depends on algorithms yielding intermediate states
4. **3D height field** is independent of the algorithm comparison pipeline -- can be built in parallel
5. **Stats/ranking** depends on algorithms completing, but collection should happen during execution
6. **Side-by-side layout** is a rendering concern, independent of algorithm logic

## MVP Recommendation

For MVP, prioritize these to get a working, impressive demo:

1. **City placement + random generation** (table stakes, foundation for everything)
2. **3-4 algorithms running and displaying results** (nearest neighbor, greedy, 2-opt, simulated annealing -- enough to compare)
3. **2D canvas with color-coded tours** (visual output is the point)
4. **Basic stats display** (tour length per algorithm, simple ranking)
5. **3D gravitational height field** (the differentiator -- ship this early or it risks being cut)
6. **Gravitational heuristic** (the novel algorithm, paired with the 3D surface)

Defer to post-MVP:

- **Full 10+ algorithm suite**: Add algorithms incrementally. The pluggable engine should make this easy once the pattern is established.
- **Step-by-step animation with controls**: Start with "run and show result." Animation is high-value but high-effort; add it once the comparison framework works.
- **Synchronized playback**: Requires animation system first. Layer 2 feature.
- **Preset city configurations beyond random**: Low effort but low urgency. Random is sufficient for initial validation.
- **Parameter controls for gravitational model**: Start with good defaults. Tuning UI comes after the model is validated.
- **Optimality gap**: Requires either brute-force baseline or known-optimal lookup. Add when polish matters.

## Sources

- [tspvis.com - TSP Visualizer](https://tspvis.com/) - Construction/improvement/exhaustive algorithms with Mapbox visualization
- [jhackshaw/tspvis on GitHub](https://github.com/jhackshaw/tspvis) - React + deck.gl + Web Workers architecture
- [VisuAlgo TSP](https://visualgo.net/en/tsp) - Educational TSP with keyboard animation controls
- [StemLounge - 11 Animated Algorithms for TSP](https://stemlounge.com/animated-algorithms-for-the-traveling-salesman-problem/) - Comprehensive algorithm survey with animated GIFs on Dantzig49
- [pmaitland/TSP-Visualisation](https://github.com/pmaitland/TSP-Visualisation) - Step log and 5-button animation control bar
- [afourmy/pyTSP](https://github.com/afourmy/pyTSP) - 2D/3D TSP visualization with multiple heuristics
- [TSP Visualizer on Vercel](https://tspvisualizer.vercel.app/) - Multiple heuristics with coordinate input
- [Algorithm Visualizer vs VisuAlgo comparison](https://daily.dev/blog/algorithm-visualizer-vs-visualgo-comparison) - Feature comparison of general algorithm visualizers
- [Codewave - Algorithm Visualization Tools 2026](https://codewave.com/insights/algorithm-visualization-tools-techniques/) - UX patterns in algorithm visualization
- [TSP Algorithm Selection](https://tspalgsel.github.io/) - Standardized benchmarking approaches
