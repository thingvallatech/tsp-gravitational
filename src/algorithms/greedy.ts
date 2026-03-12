import type { City } from '@/lib/types';
import type { AlgoStep } from './types';
import { euclideanDistance } from '@/lib/math-utils';
import { tourLength, tourEdges } from './tour-utils';

interface Edge {
  a: number;
  b: number;
  dist: number;
}

/** Greedy edge-insertion construction heuristic */
export function solveGreedy(cities: City[]): AlgoStep[] {
  const n = cities.length;
  if (n === 0) return [];
  if (n === 1) return [{ tour: [0], edges: [], cost: 0, description: 'Greedy: single city' }];

  const steps: AlgoStep[] = [];

  // Build all edges sorted by distance
  const allEdges: Edge[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      allEdges.push({
        a: i,
        b: j,
        dist: euclideanDistance(cities[i].x, cities[i].y, cities[j].x, cities[j].y),
      });
    }
  }
  allEdges.sort((e1, e2) => e1.dist - e2.dist);

  // Track degree and adjacency for cycle/degree constraints
  const degree = new Uint8Array(n);
  const adj: number[][] = Array.from({ length: n }, () => []);
  const selectedEdges: [number, number][] = [];
  let edgesAdded = 0;

  // Union-Find for cycle detection
  const parent = Array.from({ length: n }, (_, i) => i);
  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }
  function union(x: number, y: number): void {
    parent[find(x)] = find(y);
  }

  for (const edge of allEdges) {
    if (edgesAdded === n) break;

    const { a, b, dist } = edge;

    // Constraint: no vertex with degree > 2
    if (degree[a] >= 2 || degree[b] >= 2) continue;

    // Constraint: don't close a cycle prematurely (unless it would complete the tour)
    if (edgesAdded < n - 1 && find(a) === find(b)) continue;

    // Add edge
    degree[a]++;
    degree[b]++;
    adj[a].push(b);
    adj[b].push(a);
    union(a, b);
    selectedEdges.push([a, b]);
    edgesAdded++;

    steps.push({
      tour: [],
      edges: [...selectedEdges],
      cost: dist,
      description: `Greedy: adding edge ${a}-${b} (distance ${dist.toFixed(3)})`,
    });
  }

  // Reconstruct tour from adjacency list
  const tour = reconstructTour(adj, n);
  const finalCost = tourLength(cities, tour);

  steps.push({
    tour: [...tour],
    edges: tourEdges(tour),
    cost: finalCost,
    description: `Greedy: tour complete, total cost ${finalCost.toFixed(3)}`,
  });

  return steps;
}

function reconstructTour(adj: number[][], n: number): number[] {
  const tour: number[] = [0];
  const visited = new Uint8Array(n);
  visited[0] = 1;

  let current = 0;
  for (let step = 1; step < n; step++) {
    const next = adj[current].find((v) => !visited[v]);
    if (next === undefined) break;
    tour.push(next);
    visited[next] = 1;
    current = next;
  }

  return tour;
}
