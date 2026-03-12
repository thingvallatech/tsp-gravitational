import type { City } from '@/lib/types';
import type { AlgoStep } from './types';
import { computeCentroid } from '@/lib/math-utils';
import { tourLength, tourEdges } from './tour-utils';

/** Elastic Net (Durbin & Willshaw 1987) approach to TSP */
export function solveElasticNet(cities: City[]): AlgoStep[] {
  const n = cities.length;
  if (n === 0) return [];
  if (n <= 2) {
    const tour = Array.from({ length: n }, (_, i) => i);
    return [{ tour, edges: tourEdges(tour), cost: tourLength(cities, tour), description: 'Elastic Net: trivial tour' }];
  }

  const steps: AlgoStep[] = [];
  const M = Math.ceil(2.5 * n); // net node count
  const alphaParam = 0.2;
  const betaParam = 2.0;
  const K_start = 0.2;
  const K_end = 0.01;
  const maxIterations = 200;

  // Initialize ring of M points around centroid
  const centroid = computeCentroid(cities);
  const radius = 0.3;
  const netX = new Float64Array(M);
  const netY = new Float64Array(M);

  for (let i = 0; i < M; i++) {
    const angle = (2 * Math.PI * i) / M;
    netX[i] = centroid.x + radius * Math.cos(angle);
    netY[i] = centroid.y + radius * Math.sin(angle);
  }

  let K = K_start;
  const kDecay = Math.pow(K_end / K_start, 1 / maxIterations);

  for (let iter = 0; iter < maxIterations; iter++) {
    const invKSq = 1 / (K * K);

    // For each city, find nearest net node and compute weights
    for (let c = 0; c < n; c++) {
      const cx = cities[c].x;
      const cy = cities[c].y;

      // Compute weights w(c, j) = exp(-|city_c - net_j|^2 / (2K^2))
      const weights = new Float64Array(M);
      let totalWeight = 0;

      for (let j = 0; j < M; j++) {
        const dx = cx - netX[j];
        const dy = cy - netY[j];
        const distSq = dx * dx + dy * dy;
        weights[j] = Math.exp(-distSq * 0.5 * invKSq);
        totalWeight += weights[j];
      }

      // Normalize and apply city attraction force
      if (totalWeight > 1e-12) {
        for (let j = 0; j < M; j++) {
          const w = weights[j] / totalWeight;
          netX[j] += alphaParam * w * (cx - netX[j]);
          netY[j] += alphaParam * w * (cy - netY[j]);
        }
      }
    }

    // Neighbor tension: move each net node toward its neighbors
    const prevX = new Float64Array(M);
    const prevY = new Float64Array(M);
    for (let j = 0; j < M; j++) {
      prevX[j] = netX[j];
      prevY[j] = netY[j];
    }

    for (let j = 0; j < M; j++) {
      const prev = (j - 1 + M) % M;
      const next = (j + 1) % M;
      const tensionX = prevX[prev] + prevX[next] - 2 * prevX[j];
      const tensionY = prevY[prev] + prevY[next] - 2 * prevY[j];
      netX[j] += betaParam * K * tensionX;
      netY[j] += betaParam * K * tensionY;
    }

    K *= kDecay;

    // Record step every 5 iterations
    if ((iter + 1) % 5 === 0 || iter === maxIterations - 1) {
      // Map each city to its nearest net node, derive tour order
      const tour = mapNetToTour(cities, netX, netY, M);
      const cost = tourLength(cities, tour);

      steps.push({
        tour: [...tour],
        edges: tourEdges(tour),
        cost,
        description: `Elastic Net: iteration ${iter + 1}, K=${K.toFixed(4)}, ring deformation`,
      });
    }
  }

  return steps;
}

/** Map cities to net nodes and derive tour order */
function mapNetToTour(cities: City[], netX: Float64Array, netY: Float64Array, M: number): number[] {
  const n = cities.length;

  // For each city, find its closest net node index
  const cityToNetIdx: { cityIdx: number; netIdx: number }[] = [];

  for (let c = 0; c < n; c++) {
    let bestNet = 0;
    let bestDist = Infinity;
    for (let j = 0; j < M; j++) {
      const dx = cities[c].x - netX[j];
      const dy = cities[c].y - netY[j];
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        bestNet = j;
      }
    }
    cityToNetIdx.push({ cityIdx: c, netIdx: bestNet });
  }

  // Sort cities by their net node index to get tour order
  cityToNetIdx.sort((a, b) => a.netIdx - b.netIdx);

  return cityToNetIdx.map(c => c.cityIdx);
}
