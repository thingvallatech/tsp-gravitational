import type { City } from '@/lib/types';
import type { AlgoStep } from './types';
import { tourLength, tourEdges } from './tour-utils';
import { euclideanDistance } from '@/lib/math-utils';

/** 3-Opt improvement heuristic (limited passes to control step count) */
export function solveThreeOpt(cities: City[]): AlgoStep[] {
  const n = cities.length;
  if (n === 0) return [];
  if (n <= 3) {
    const tour = Array.from({ length: n }, (_, i) => i);
    return [{ tour, edges: tourEdges(tour), cost: tourLength(cities, tour), description: '3-Opt: trivial tour' }];
  }

  const steps: AlgoStep[] = [];
  const tour = Array.from({ length: n }, (_, i) => i);

  let cost = tourLength(cities, tour);
  steps.push({
    tour: [...tour],
    edges: tourEdges(tour),
    cost,
    description: `3-Opt: initial tour, cost ${cost.toFixed(3)}`,
  });

  const maxPasses = 3;

  for (let pass = 0; pass < maxPasses; pass++) {
    let improved = false;

    for (let i = 0; i < n - 2; i++) {
      for (let j = i + 2; j < n - 1; j++) {
        for (let k = j + 2; k < n + (i > 0 ? 0 : -1); k++) {
          const bestReconnection = findBestReconnection(cities, tour, i, j, k, n);
          if (bestReconnection.saved > 1e-10) {
            applyReconnection(tour, i, j, k, n, bestReconnection.type);
            cost -= bestReconnection.saved;
            improved = true;

            steps.push({
              tour: [...tour],
              edges: tourEdges(tour),
              cost,
              description: `3-Opt: reconnecting segments at positions ${i},${j},${k}, saved ${bestReconnection.saved.toFixed(3)}`,
            });
          }
        }
      }
    }

    if (!improved) break;
  }

  steps.push({
    tour: [...tour],
    edges: tourEdges(tour),
    cost,
    description: `3-Opt: complete, final cost ${cost.toFixed(3)}`,
  });

  return steps;
}

function dist(cities: City[], a: number, b: number): number {
  return euclideanDistance(cities[a].x, cities[a].y, cities[b].x, cities[b].y);
}

interface Reconnection {
  saved: number;
  type: number;
}

function findBestReconnection(
  cities: City[], tour: number[], i: number, j: number, k: number, n: number
): Reconnection {
  const A = tour[i], B = tour[(i + 1) % n];
  const C = tour[j], D = tour[(j + 1) % n];
  const E = tour[k], F = tour[(k + 1) % n];

  const d_AB = dist(cities, A, B);
  const d_CD = dist(cities, C, D);
  const d_EF = dist(cities, E, F);
  const original = d_AB + d_CD + d_EF;

  let best: Reconnection = { saved: 0, type: 0 };

  // Type 1: reverse segment [i+1..j]  (equivalent to 2-opt on edges AB, CD)
  const t1 = dist(cities, A, C) + dist(cities, B, D) + d_EF;
  if (original - t1 > best.saved) best = { saved: original - t1, type: 1 };

  // Type 2: reverse segment [j+1..k]  (equivalent to 2-opt on edges CD, EF)
  const t2 = d_AB + dist(cities, C, E) + dist(cities, D, F);
  if (original - t2 > best.saved) best = { saved: original - t2, type: 2 };

  // Type 3: reverse segment [i+1..j] and [j+1..k]
  const t3 = dist(cities, A, C) + dist(cities, B, E) + dist(cities, D, F);
  if (original - t3 > best.saved) best = { saved: original - t3, type: 3 };

  // Type 4: Or-opt style -- move segment [i+1..j] to between k and k+1
  const t4 = dist(cities, A, D) + dist(cities, E, B) + dist(cities, C, F);
  if (original - t4 > best.saved) best = { saved: original - t4, type: 4 };

  return best;
}

function applyReconnection(tour: number[], i: number, j: number, k: number, n: number, type: number): void {
  switch (type) {
    case 1:
      reverseSegment(tour, i + 1, j);
      break;
    case 2:
      reverseSegment(tour, j + 1, k);
      break;
    case 3:
      reverseSegment(tour, i + 1, j);
      reverseSegment(tour, j + 1, k);
      break;
    case 4: {
      // Or-opt: move segment [i+1..j] to after k
      const segment = tour.splice(i + 1, j - i);
      // Adjust k since we removed elements
      const newK = k - segment.length;
      tour.splice(newK + 1, 0, ...segment);
      break;
    }
  }
}

function reverseSegment(tour: number[], left: number, right: number): void {
  while (left < right) {
    const tmp = tour[left];
    tour[left] = tour[right];
    tour[right] = tmp;
    left++;
    right--;
  }
}
