import type { City } from '@/lib/types';
import type { AlgoStep } from './types';
import { tourLength, tourEdges } from './tour-utils';
import { euclideanDistance } from '@/lib/math-utils';

/** 2-Opt improvement heuristic */
export function solveTwoOpt(cities: City[]): AlgoStep[] {
  const n = cities.length;
  if (n === 0) return [];
  if (n <= 2) {
    const tour = Array.from({ length: n }, (_, i) => i);
    return [{ tour, edges: tourEdges(tour), cost: tourLength(cities, tour), description: '2-Opt: trivial tour' }];
  }

  const steps: AlgoStep[] = [];
  const tour = Array.from({ length: n }, (_, i) => i);

  let cost = tourLength(cities, tour);
  steps.push({
    tour: [...tour],
    edges: tourEdges(tour),
    cost,
    description: `2-Opt: initial tour, cost ${cost.toFixed(3)}`,
  });

  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n; j++) {
        // Skip if the segment reversal wraps around (i=0, j=n-1 is just full reversal)
        if (i === 0 && j === n - 1) continue;

        const a = tour[i], b = tour[i + 1];
        const c = tour[j], d = tour[(j + 1) % n];

        const oldDist = euclideanDistance(cities[a].x, cities[a].y, cities[b].x, cities[b].y)
                      + euclideanDistance(cities[c].x, cities[c].y, cities[d].x, cities[d].y);
        const newDist = euclideanDistance(cities[a].x, cities[a].y, cities[c].x, cities[c].y)
                      + euclideanDistance(cities[b].x, cities[b].y, cities[d].x, cities[d].y);

        const saved = oldDist - newDist;
        if (saved > 1e-10) {
          // Reverse segment [i+1..j]
          let left = i + 1;
          let right = j;
          while (left < right) {
            const tmp = tour[left];
            tour[left] = tour[right];
            tour[right] = tmp;
            left++;
            right--;
          }

          cost -= saved;
          improved = true;

          steps.push({
            tour: [...tour],
            edges: tourEdges(tour),
            cost,
            description: `2-Opt: reversing segment [${i + 1}..${j}], saved ${saved.toFixed(3)}`,
          });
        }
      }
    }
  }

  steps.push({
    tour: [...tour],
    edges: tourEdges(tour),
    cost,
    description: `2-Opt: complete, final cost ${cost.toFixed(3)}`,
  });

  return steps;
}
