import type { City } from '@/lib/types';
import { euclideanDistance } from '@/lib/math-utils';

/** Compute total tour length (round-trip) for a given ordering of cities */
export function tourLength(cities: City[], tour: number[]): number {
  if (tour.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < tour.length - 1; i++) {
    const a = cities[tour[i]];
    const b = cities[tour[i + 1]];
    total += euclideanDistance(a.x, a.y, b.x, b.y);
  }
  // Closing edge back to start
  const last = cities[tour[tour.length - 1]];
  const first = cities[tour[0]];
  total += euclideanDistance(last.x, last.y, first.x, first.y);
  return total;
}

/** Return edges as index pairs including the closing edge */
export function tourEdges(tour: number[]): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 0; i < tour.length - 1; i++) {
    edges.push([tour[i], tour[i + 1]]);
  }
  if (tour.length >= 2) {
    edges.push([tour[tour.length - 1], tour[0]]);
  }
  return edges;
}
