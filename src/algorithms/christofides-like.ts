import type { City } from '@/lib/types';
import type { AlgoStep } from './types';
import { euclideanDistance } from '@/lib/math-utils';
import { tourLength, tourEdges } from './tour-utils';

/** MST-based approximation (MST + greedy matching + shortcutting) */
export function solveChristofidesLike(cities: City[]): AlgoStep[] {
  const n = cities.length;
  if (n === 0) return [];
  if (n <= 2) {
    const tour = Array.from({ length: n }, (_, i) => i);
    return [{ tour, edges: tourEdges(tour), cost: tourLength(cities, tour), description: 'MST Approx: trivial tour' }];
  }

  const steps: AlgoStep[] = [];

  // Step 1: Build MST using Prim's algorithm
  const mstEdges: [number, number][] = [];
  const inMST = new Uint8Array(n);
  const key = new Float64Array(n).fill(Infinity);
  const parent = new Int32Array(n).fill(-1);

  key[0] = 0;

  for (let count = 0; count < n; count++) {
    // Find minimum key vertex not in MST
    let u = -1;
    let minKey = Infinity;
    for (let v = 0; v < n; v++) {
      if (!inMST[v] && key[v] < minKey) {
        minKey = key[v];
        u = v;
      }
    }
    if (u === -1) break;

    inMST[u] = 1;

    if (parent[u] !== -1) {
      mstEdges.push([parent[u], u]);
      steps.push({
        tour: [],
        edges: [...mstEdges],
        cost: 0,
        description: `MST: adding edge ${parent[u]}-${u}`,
      });
    }

    // Update keys of adjacent vertices
    for (let v = 0; v < n; v++) {
      if (inMST[v]) continue;
      const d = euclideanDistance(cities[u].x, cities[u].y, cities[v].x, cities[v].y);
      if (d < key[v]) {
        key[v] = d;
        parent[v] = u;
      }
    }
  }

  // Step 2: Find vertices with odd degree
  const degree = new Uint32Array(n);
  for (const [a, b] of mstEdges) {
    degree[a]++;
    degree[b]++;
  }
  const oddVertices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (degree[i] % 2 === 1) oddVertices.push(i);
  }

  // Step 3: Greedy matching of odd-degree vertices
  const matchingEdges: [number, number][] = [];
  const matched = new Uint8Array(n);

  // Sort odd vertices' pairs by distance and greedily match
  const pairs: { a: number; b: number; dist: number }[] = [];
  for (let i = 0; i < oddVertices.length; i++) {
    for (let j = i + 1; j < oddVertices.length; j++) {
      const a = oddVertices[i], b = oddVertices[j];
      pairs.push({ a, b, dist: euclideanDistance(cities[a].x, cities[a].y, cities[b].x, cities[b].y) });
    }
  }
  pairs.sort((p1, p2) => p1.dist - p2.dist);

  for (const pair of pairs) {
    if (!matched[pair.a] && !matched[pair.b]) {
      matched[pair.a] = 1;
      matched[pair.b] = 1;
      matchingEdges.push([pair.a, pair.b]);
    }
  }

  steps.push({
    tour: [],
    edges: [...mstEdges, ...matchingEdges],
    cost: 0,
    description: `MST Approx: matched ${matchingEdges.length} odd-degree vertex pairs`,
  });

  // Step 4: Build multigraph adjacency list from MST + matching edges
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of mstEdges) {
    adj[a].push(b);
    adj[b].push(a);
  }
  for (const [a, b] of matchingEdges) {
    adj[a].push(b);
    adj[b].push(a);
  }

  // Step 5: Find Eulerian circuit using Hierholzer's algorithm
  const edgeCount = new Map<string, number>();
  for (let v = 0; v < n; v++) {
    for (const u of adj[v]) {
      const key = `${Math.min(v, u)}-${Math.max(v, u)}`;
      edgeCount.set(key, (edgeCount.get(key) ?? 0) + 1);
    }
  }
  // Each edge counted twice (once from each endpoint)
  for (const [k, v] of edgeCount) {
    edgeCount.set(k, v / 2);
  }

  const circuit: number[] = [];
  const stack: number[] = [0];
  const localAdj: number[][] = adj.map(a => [...a]);

  while (stack.length > 0) {
    const v = stack[stack.length - 1];
    if (localAdj[v].length > 0) {
      const u = localAdj[v].pop()!;
      // Remove u->v edge as well
      const idx = localAdj[u].indexOf(v);
      if (idx !== -1) localAdj[u].splice(idx, 1);
      stack.push(u);
    } else {
      circuit.push(stack.pop()!);
    }
  }

  // Step 6: Shortcut to Hamiltonian tour
  const visited = new Uint8Array(n);
  const tour: number[] = [];
  for (const v of circuit) {
    if (!visited[v]) {
      visited[v] = 1;
      tour.push(v);
    }
  }

  const finalCost = tourLength(cities, tour);
  steps.push({
    tour: [...tour],
    edges: tourEdges(tour),
    cost: finalCost,
    description: `MST Approx: tour complete after shortcutting, cost ${finalCost.toFixed(3)}`,
  });

  return steps;
}
