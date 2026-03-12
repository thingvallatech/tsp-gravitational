import type { City } from '@/lib/types';
import type { AlgoStep } from './types';
import { euclideanDistance } from '@/lib/math-utils';
import { tourLength, tourEdges } from './tour-utils';

/** Nearest Neighbor construction heuristic */
export function solveNearestNeighbor(cities: City[]): AlgoStep[] {
  const n = cities.length;
  if (n === 0) return [];
  if (n === 1) return [{ tour: [0], edges: [], cost: 0, description: 'Nearest Neighbor: single city' }];

  const steps: AlgoStep[] = [];
  const visited = new Uint8Array(n);
  const tour: number[] = [0];
  visited[0] = 1;

  // Record starting step
  steps.push({
    tour: [...tour],
    edges: [],
    cost: 0,
    description: `Nearest Neighbor: starting at city 0`,
  });

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

    steps.push({
      tour: [...tour],
      edges: tourEdges(tour),
      cost: tourLength(cities, tour),
      description: `Nearest Neighbor: connecting city ${current} to city ${bestCity} (distance ${bestDist.toFixed(3)})`,
    });
  }

  // Final step with closed tour
  const finalCost = tourLength(cities, tour);
  steps.push({
    tour: [...tour],
    edges: tourEdges(tour),
    cost: finalCost,
    description: `Nearest Neighbor: tour complete, total cost ${finalCost.toFixed(3)}`,
  });

  return steps;
}
