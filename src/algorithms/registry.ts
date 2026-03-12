import type { TSPAlgorithm } from './types';
import { solveNearestNeighbor } from './nearest-neighbor';
import { solveGreedy } from './greedy';
import { solveTwoOpt } from './two-opt';
import { solveThreeOpt } from './three-opt';
import { solveSimulatedAnnealing } from './simulated-annealing';
import { solveGeneticAlgorithm } from './genetic-algorithm';
import { solveAntColony } from './ant-colony';
import { solveChristofidesLike } from './christofides-like';
import { solveElasticNet } from './elastic-net';
import { solveGravitational } from './gravitational';

/** All registered TSP algorithms with distinct colors */
export const ALGORITHM_REGISTRY: TSPAlgorithm[] = [
  {
    id: 'nearest-neighbor',
    name: 'Nearest Neighbor',
    category: 'construction',
    color: '#ff6b6b',
    description: 'Greedy construction: always visit the nearest unvisited city',
    solve: solveNearestNeighbor,
  },
  {
    id: 'greedy',
    name: 'Greedy',
    category: 'construction',
    color: '#ffa502',
    description: 'Add shortest edges that form a valid tour',
    solve: solveGreedy,
  },
  {
    id: '2-opt',
    name: '2-Opt',
    category: 'improvement',
    color: '#1dd1a1',
    description: 'Iteratively reverse tour segments to reduce crossings',
    solve: solveTwoOpt,
  },
  {
    id: '3-opt',
    name: '3-Opt',
    category: 'improvement',
    color: '#00d2d3',
    description: 'Reconnect three tour segments for deeper optimization',
    solve: solveThreeOpt,
  },
  {
    id: 'simulated-annealing',
    name: 'Simulated Annealing',
    category: 'metaheuristic',
    color: '#ff9ff3',
    description: 'Temperature-based exploration with 2-opt neighborhood moves',
    solve: solveSimulatedAnnealing,
  },
  {
    id: 'genetic-algorithm',
    name: 'Genetic Algorithm',
    category: 'metaheuristic',
    color: '#f368e0',
    description: 'Evolve a population of tours via crossover and mutation',
    solve: solveGeneticAlgorithm,
  },
  {
    id: 'ant-colony',
    name: 'Ant Colony Optimization',
    category: 'metaheuristic',
    color: '#ff6348',
    description: 'Pheromone-guided probabilistic tour construction',
    solve: solveAntColony,
  },
  {
    id: 'christofides-like',
    name: 'MST Approximation',
    category: 'construction',
    color: '#7bed9f',
    description: 'MST + greedy matching + shortcutting',
    solve: solveChristofidesLike,
  },
  {
    id: 'elastic-net',
    name: 'Elastic Net',
    category: 'metaheuristic',
    color: '#70a1ff',
    description: 'Deformable ring converges onto city positions (Durbin & Willshaw)',
    solve: solveElasticNet,
  },
  {
    id: 'gravitational',
    name: 'Gravitational Centerpoint',
    category: 'novel',
    color: '#a29bfe',
    description: 'Novel heuristic: drainage on isolation-weighted gravitational surface',
    solve: solveGravitational,
    requiresSurface: true,
  },
];
