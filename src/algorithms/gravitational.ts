import type { City, SurfaceData } from '@/lib/types';
import type { AlgoStep } from './types';
import { tourLength, tourEdges } from './tour-utils';

/**
 * Gravitational Centerpoint heuristic (novel algorithm).
 *
 * Uses the pre-computed height field surface:
 * 1. Start at the grid point with maximum height (centroid lift peak)
 * 2. Steepest descent on the height field to find gravity wells (cities)
 * 3. When descent reaches a local minimum near an unvisited city, add it to tour
 * 4. "Fill" visited wells to prevent revisiting, resume descent
 * 5. Repeat until all cities visited
 */
export function solveGravitational(cities: City[], surfaceData?: SurfaceData): AlgoStep[] {
  const n = cities.length;
  if (n === 0) return [];
  if (n <= 2) {
    const tour = Array.from({ length: n }, (_, i) => i);
    return [{ tour, edges: tourEdges(tour), cost: tourLength(cities, tour), description: 'Gravitational: trivial tour' }];
  }

  if (!surfaceData) {
    // Fallback: can't run without surface data
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

  // Work on a COPY of the height field (never mutate store data)
  const field = new Float32Array(surfaceData.heightField);

  // Map city positions to grid cells
  const cityGrid = cities.map(c => ({
    gx: Math.round(c.x * (res - 1)),
    gy: Math.round(c.y * (res - 1)),
  }));

  const visited = new Uint8Array(n);
  const tour: number[] = [];

  // Find starting point: grid cell with maximum height (centroid peak)
  let startGx = 0, startGy = 0;
  let maxH = -Infinity;
  for (let gy = 0; gy < res; gy++) {
    for (let gx = 0; gx < res; gx++) {
      const h = field[gy * res + gx];
      if (h > maxH) {
        maxH = h;
        startGx = gx;
        startGy = gy;
      }
    }
  }

  let curGx = startGx;
  let curGy = startGy;

  // 8-directional neighbor offsets
  const dx8 = [-1, -1, -1, 0, 0, 1, 1, 1];
  const dy8 = [-1, 0, 1, -1, 1, -1, 0, 1];

  const maxStepsPerDescent = res * res; // safety limit
  const nearbyRadius = 2; // grid cells

  while (tour.length < n) {
    // Steepest descent from current position
    let stepsInDescent = 0;
    let foundCity = -1;

    while (stepsInDescent < maxStepsPerDescent) {
      stepsInDescent++;

      // Check if we're near any unvisited city
      foundCity = findNearbyCity(curGx, curGy, cityGrid, visited, nearbyRadius);
      if (foundCity !== -1) break;

      // Find steepest descent neighbor
      let bestH = field[curGy * res + curGx];
      let bestGx = curGx, bestGy = curGy;

      for (let d = 0; d < 8; d++) {
        const nx = curGx + dx8[d];
        const ny = curGy + dy8[d];
        if (nx < 0 || nx >= res || ny < 0 || ny >= res) continue;
        const h = field[ny * res + nx];
        if (h < bestH) {
          bestH = h;
          bestGx = nx;
          bestGy = ny;
        }
      }

      // Stuck at local minimum without finding a city
      if (bestGx === curGx && bestGy === curGy) break;

      curGx = bestGx;
      curGy = bestGy;
    }

    if (foundCity !== -1) {
      // Add city to tour
      visited[foundCity] = 1;
      tour.push(foundCity);

      const depth = field[curGy * res + curGx];

      steps.push({
        tour: [...tour],
        edges: tourEdges(tour),
        cost: tour.length >= 2 ? tourLength(cities, tour) : 0,
        description: `Gravitational: drainage reached city ${foundCity} at depth ${depth.toFixed(3)}`,
      });

      // "Fill" the visited well: set height values within kernel radius to local max
      fillWell(field, res, cityGrid[foundCity].gx, cityGrid[foundCity].gy, nearbyRadius * 3);

      // Continue descent from the filled point
    } else {
      // Descent got stuck without finding a city
      // Find nearest unvisited city and add it directly (fallback)
      const refX = tour.length > 0 ? cities[tour[tour.length - 1]].x : curGx / (res - 1);
      const refY = tour.length > 0 ? cities[tour[tour.length - 1]].y : curGy / (res - 1);
      let nearestDist = Infinity;
      let nearestIdx = -1;
      for (let i = 0; i < n; i++) {
        if (visited[i]) continue;
        const ddx = refX - cities[i].x;
        const ddy = refY - cities[i].y;
        const d = Math.sqrt(ddx * ddx + ddy * ddy);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = i;
        }
      }

      if (nearestIdx !== -1) {
        visited[nearestIdx] = 1;
        tour.push(nearestIdx);
        fillWell(field, res, cityGrid[nearestIdx].gx, cityGrid[nearestIdx].gy, nearbyRadius * 3);

        // Restart descent from the highest point near remaining unvisited cities
        let bestH = -Infinity;
        for (let i = 0; i < n; i++) {
          if (visited[i]) continue;
          const cgx = cityGrid[i].gx;
          const cgy = cityGrid[i].gy;
          for (let ddy = -5; ddy <= 5; ddy++) {
            for (let ddx = -5; ddx <= 5; ddx++) {
              const nx = cgx + ddx;
              const ny = cgy + ddy;
              if (nx < 0 || nx >= res || ny < 0 || ny >= res) continue;
              const h = field[ny * res + nx];
              if (h > bestH) {
                bestH = h;
                curGx = nx;
                curGy = ny;
              }
            }
          }
        }

        steps.push({
          tour: [...tour],
          edges: tourEdges(tour),
          cost: tourLength(cities, tour),
          description: `Gravitational: fallback to nearest unvisited city ${nearestIdx}`,
        });
      }
    }
  }

  // Final step
  const finalCost = tourLength(cities, tour);
  steps.push({
    tour: [...tour],
    edges: tourEdges(tour),
    cost: finalCost,
    description: `Gravitational: tour complete, cost ${finalCost.toFixed(3)}`,
  });

  return steps;
}

/** Find any unvisited city within radius grid cells of (gx, gy) */
function findNearbyCity(
  gx: number, gy: number,
  cityGrid: { gx: number; gy: number }[],
  visited: Uint8Array,
  radius: number,
): number {
  let bestIdx = -1;
  let bestDistSq = Infinity;

  for (let i = 0; i < cityGrid.length; i++) {
    if (visited[i]) continue;
    const dx = gx - cityGrid[i].gx;
    const dy = gy - cityGrid[i].gy;
    const distSq = dx * dx + dy * dy;
    if (distSq <= radius * radius && distSq < bestDistSq) {
      bestDistSq = distSq;
      bestIdx = i;
    }
  }

  return bestIdx;
}

/** Fill a well by raising height values around (cx, cy) to local maximum */
function fillWell(field: Float32Array, res: number, cx: number, cy: number, radius: number): void {
  // Find local max in the area
  let localMax = -Infinity;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || nx >= res || ny < 0 || ny >= res) continue;
      const h = field[ny * res + nx];
      if (h > localMax) localMax = h;
    }
  }

  // Set all cells in radius to local max (fill the well)
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || nx >= res || ny < 0 || ny >= res) continue;
      const distSq = dx * dx + dy * dy;
      if (distSq <= radius * radius) {
        field[ny * res + nx] = localMax;
      }
    }
  }
}
