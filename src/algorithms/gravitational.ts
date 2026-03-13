import type { City, SurfaceData } from '@/lib/types';
import type { AlgoStep } from './types';
import { tourLength, tourEdges } from './tour-utils';
import { euclideanDistance } from '@/lib/math-utils';

/**
 * Gravitational Centerpoint heuristic (novel algorithm).
 *
 * Uses the pre-computed height field surface to guide tour construction:
 * 1. Compute surface-aware distances between cities using path integrals
 *    along the height field (edges crossing ridges cost more, valleys cost less)
 * 2. Build initial tour using gravity-weighted nearest neighbor from centroid peak
 * 3. Refine with 2-opt using the same surface-weighted distances
 *
 * The key insight: the gravitational surface encodes cluster structure via
 * wells and ridges. By making ridge-crossing expensive, the algorithm
 * naturally visits nearby cities in the same basin before moving to the next.
 */
export function solveGravitational(cities: City[], surfaceData?: SurfaceData): AlgoStep[] {
  const n = cities.length;
  if (n === 0) return [];
  if (n <= 2) {
    const tour = Array.from({ length: n }, (_, i) => i);
    return [{ tour, edges: tourEdges(tour), cost: tourLength(cities, tour), description: 'Gravitational: trivial tour' }];
  }

  if (!surfaceData) {
    const tour = Array.from({ length: n }, (_, i) => i);
    return [{
      tour,
      edges: tourEdges(tour),
      cost: tourLength(cities, tour),
      description: 'Gravitational: no surface data available, returning default tour',
    }];
  }

  const steps: AlgoStep[] = [];
  const res = surfaceData.gridResolution;
  const field = surfaceData.heightField;

  // Step 1: Compute surface-weighted distances between all city pairs.
  // The cost of an edge is the Euclidean distance multiplied by a ridge penalty:
  // higher average height along the path = more expensive edge.
  const surfaceDist = new Float64Array(n * n);
  const eucDist = new Float64Array(n * n);

  // Pre-compute height at each city
  const cityHeight = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const gx = Math.min(Math.round(cities[i].x * (res - 1)), res - 1);
    const gy = Math.min(Math.round(cities[i].y * (res - 1)), res - 1);
    cityHeight[i] = field[gy * res + gx];
  }

  // Min/max height for normalization
  const minH = surfaceData.minHeight;
  const maxH = surfaceData.maxHeight;
  const rangeH = maxH - minH || 1;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = euclideanDistance(cities[i].x, cities[i].y, cities[j].x, cities[j].y);
      eucDist[i * n + j] = d;
      eucDist[j * n + i] = d;

      // Sample height along the edge at ~10 points
      const samples = Math.max(5, Math.ceil(d * res * 0.5));
      let avgHeight = 0;
      let maxEdgeHeight = -Infinity;

      for (let s = 0; s <= samples; s++) {
        const t = s / samples;
        const wx = cities[i].x + t * (cities[j].x - cities[i].x);
        const wy = cities[i].y + t * (cities[j].y - cities[i].y);
        const gx = Math.min(Math.round(wx * (res - 1)), res - 1);
        const gy = Math.min(Math.round(wy * (res - 1)), res - 1);
        const h = field[gy * res + gx];
        avgHeight += h;
        if (h > maxEdgeHeight) maxEdgeHeight = h;
      }
      avgHeight /= (samples + 1);

      // Ridge penalty: edges crossing high terrain are penalized
      // Normalize height to [0,1], use as multiplier
      const avgNorm = (avgHeight - minH) / rangeH;
      const maxNorm = (maxEdgeHeight - minH) / rangeH;
      // Blend: 60% avg height penalty + 40% max height penalty
      const ridgePenalty = 1 + 2.0 * (0.6 * avgNorm + 0.4 * maxNorm);

      // Well bonus: cities in deep wells (low height) are attractive
      const depthI = 1 - (cityHeight[i] - minH) / rangeH;
      const depthJ = 1 - (cityHeight[j] - minH) / rangeH;
      const wellBonus = 1 - 0.3 * (depthI + depthJ) / 2;

      const surfD = d * ridgePenalty * wellBonus;
      surfaceDist[i * n + j] = surfD;
      surfaceDist[j * n + i] = surfD;
    }
  }

  steps.push({
    tour: [],
    edges: [],
    cost: 0,
    description: 'Gravitational: computed surface-weighted distance matrix',
  });

  // Step 2: Find starting city — the one in the deepest well (most gravitational pull)
  let startCity = 0;
  let deepestH = Infinity;
  for (let i = 0; i < n; i++) {
    if (cityHeight[i] < deepestH) {
      deepestH = cityHeight[i];
      startCity = i;
    }
  }

  // Step 3: Gravity-guided nearest neighbor construction
  const visited = new Uint8Array(n);
  const tour: number[] = [startCity];
  visited[startCity] = 1;

  steps.push({
    tour: [...tour],
    edges: tourEdges(tour),
    cost: 0,
    description: `Gravitational: starting from city ${startCity} (deepest well, height ${cityHeight[startCity].toFixed(3)})`,
  });

  while (tour.length < n) {
    const current = tour[tour.length - 1];
    let bestNext = -1;
    let bestDist = Infinity;

    for (let j = 0; j < n; j++) {
      if (visited[j]) continue;
      const sd = surfaceDist[current * n + j];
      if (sd < bestDist) {
        bestDist = sd;
        bestNext = j;
      }
    }

    if (bestNext === -1) break;

    visited[bestNext] = 1;
    tour.push(bestNext);

    const currentCost = tourLength(cities, tour);
    const realDist = eucDist[current * n + bestNext];
    steps.push({
      tour: [...tour],
      edges: tourEdges(tour),
      cost: currentCost,
      description: `Gravitational: drainage flows to city ${bestNext} (surface dist ${bestDist.toFixed(3)}, actual ${realDist.toFixed(3)})`,
    });
  }

  // Step 4: 2-opt improvement using surface distances
  let improved = true;
  let iterations = 0;
  const maxIter = 100;

  while (improved && iterations < maxIter) {
    improved = false;
    iterations++;

    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;

        const a = tour[i], b = tour[i + 1];
        const c = tour[j], d = tour[(j + 1) % n];

        const oldDist = eucDist[a * n + b] + eucDist[c * n + d];
        const newDist = eucDist[a * n + c] + eucDist[b * n + d];

        if (newDist < oldDist - 1e-10) {
          // Reverse the segment between i+1 and j
          let left = i + 1, right = j;
          while (left < right) {
            const tmp = tour[left];
            tour[left] = tour[right];
            tour[right] = tmp;
            left++;
            right--;
          }
          improved = true;
        }
      }
    }

    if (improved && iterations % 5 === 0) {
      const cost = tourLength(cities, tour);
      steps.push({
        tour: [...tour],
        edges: tourEdges(tour),
        cost,
        description: `Gravitational: 2-opt refinement iteration ${iterations}, cost ${cost.toFixed(3)}`,
      });
    }
  }

  // Final step
  const finalCost = tourLength(cities, tour);
  steps.push({
    tour: [...tour],
    edges: tourEdges(tour),
    cost: finalCost,
    description: `Gravitational: tour complete after ${iterations} improvement rounds, cost ${finalCost.toFixed(3)}`,
  });

  return steps;
}
