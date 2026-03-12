import type { City } from '@/lib/types';
import type { AlgoStep } from './types';
import { tourLength, tourEdges } from './tour-utils';
import { euclideanDistance } from '@/lib/math-utils';

/** Simulated Annealing metaheuristic using 2-opt swaps */
export function solveSimulatedAnnealing(cities: City[]): AlgoStep[] {
  const n = cities.length;
  if (n === 0) return [];
  if (n <= 2) {
    const tour = Array.from({ length: n }, (_, i) => i);
    return [{ tour, edges: tourEdges(tour), cost: tourLength(cities, tour), description: 'SA: trivial tour' }];
  }

  const steps: AlgoStep[] = [];

  // Start with nearest-neighbor initial tour
  const tour = buildNNTour(cities);
  let cost = tourLength(cities, tour);

  steps.push({
    tour: [...tour],
    edges: tourEdges(tour),
    cost,
    description: `SA: initial NN tour, cost ${cost.toFixed(3)}`,
  });

  // SA parameters
  const T_start = 1.0;
  const T_end = 0.001;
  const cooling = 0.995;
  const itersPerTemp = n * 2;

  let T = T_start;
  let bestCost = cost;
  let bestTour = [...tour];
  let iteration = 0;

  while (T > T_end) {
    let accepted = 0;
    let rejected = 0;

    for (let iter = 0; iter < itersPerTemp; iter++) {
      // Random 2-opt swap
      let i = Math.floor(Math.random() * n);
      let j = Math.floor(Math.random() * n);
      if (i > j) { const tmp = i; i = j; j = tmp; }
      if (i === j || (i === 0 && j === n - 1)) continue;

      // Calculate delta
      const a = tour[i], b = tour[(i + 1) % n];
      const c = tour[j], d = tour[(j + 1) % n];
      const oldDist = euclideanDistance(cities[a].x, cities[a].y, cities[b].x, cities[b].y)
                    + euclideanDistance(cities[c].x, cities[c].y, cities[d].x, cities[d].y);
      const newDist = euclideanDistance(cities[a].x, cities[a].y, cities[c].x, cities[c].y)
                    + euclideanDistance(cities[b].x, cities[b].y, cities[d].x, cities[d].y);
      const delta = newDist - oldDist;

      if (delta < 0 || Math.random() < Math.exp(-delta / T)) {
        // Accept: reverse segment [i+1..j]
        let left = i + 1;
        let right = j;
        while (left < right) {
          const tmp = tour[left];
          tour[left] = tour[right];
          tour[right] = tmp;
          left++;
          right--;
        }
        cost += delta;
        accepted++;

        if (cost < bestCost) {
          bestCost = cost;
          bestTour = [...tour];
        }
      } else {
        rejected++;
      }

      iteration++;

      // Record step every 10 iterations
      if (iteration % 10 === 0) {
        steps.push({
          tour: [...tour],
          edges: tourEdges(tour),
          cost,
          description: `SA: T=${T.toFixed(4)}, cost=${cost.toFixed(3)}, ${accepted} accepted/${rejected} rejected`,
        });
      }
    }

    T *= cooling;
  }

  // Final step with best tour
  steps.push({
    tour: [...bestTour],
    edges: tourEdges(bestTour),
    cost: bestCost,
    description: `SA: complete, best cost ${bestCost.toFixed(3)}`,
  });

  return steps;
}

/** Build a quick nearest-neighbor tour for SA initial solution */
function buildNNTour(cities: City[]): number[] {
  const n = cities.length;
  const visited = new Uint8Array(n);
  const tour: number[] = [0];
  visited[0] = 1;

  for (let step = 1; step < n; step++) {
    const current = tour[tour.length - 1];
    let bestDist = Infinity;
    let bestCity = -1;
    for (let j = 0; j < n; j++) {
      if (visited[j]) continue;
      const d = euclideanDistance(cities[current].x, cities[current].y, cities[j].x, cities[j].y);
      if (d < bestDist) {
        bestDist = d;
        bestCity = j;
      }
    }
    tour.push(bestCity);
    visited[bestCity] = 1;
  }

  return tour;
}
