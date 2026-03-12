import { City } from './types';

/** Euclidean distance between two points */
export function euclideanDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Compute isolation weights for each city.
 * Weight = distance to nearest neighbor, normalized to [0, 1].
 * Outlier cities (far from others) get higher weights = deeper gravitational wells.
 */
export function computeIsolationWeights(cities: City[]): Float32Array {
  const n = cities.length;
  const weights = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    let minDist = Infinity;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dist = euclideanDistance(cities[i].x, cities[i].y, cities[j].x, cities[j].y);
      if (dist < minDist) minDist = dist;
    }
    weights[i] = minDist;
  }

  // Normalize to [0, 1]
  const maxWeight = Math.max(...weights);
  if (maxWeight > 0) {
    for (let i = 0; i < n; i++) {
      weights[i] /= maxWeight;
    }
  }

  return weights;
}

/** Compute centroid of a set of cities */
export function computeCentroid(cities: City[]): { x: number; y: number } {
  const n = cities.length;
  if (n === 0) return { x: 0.5, y: 0.5 };
  const x = cities.reduce((s, c) => s + c.x, 0) / n;
  const y = cities.reduce((s, c) => s + c.y, 0) / n;
  return { x, y };
}
