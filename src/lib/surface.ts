import { City, SurfaceParams, SurfaceData } from './types';
import { computeIsolationWeights, computeCentroid, euclideanDistance } from './math-utils';

/**
 * Compute the gravitational height field for a set of cities.
 *
 * The surface combines:
 * - A lift term that raises height proportional to distance from the centroid
 * - Gaussian wells at each city, weighted by isolation (outliers get deeper wells)
 *
 * Returns a flat Float32Array of size gridResolution^2 indexed by [gy * res + gx].
 */
export function computeHeightField(cities: City[], params: SurfaceParams): SurfaceData {
  const { gridResolution, kernelWidth, liftAlpha } = params;
  const size = gridResolution * gridResolution;
  const heightField = new Float32Array(size);

  // Edge case: no cities produces a flat zero surface
  if (cities.length === 0) {
    return { heightField, gridResolution, minHeight: 0, maxHeight: 0 };
  }

  // Pre-compute isolation weights and centroid
  const weights = computeIsolationWeights(cities);
  const centroid = computeCentroid(cities);

  // Pre-compute for inner loop performance
  const invTwoSigmaSq = 1 / (2 * kernelWidth * kernelWidth);
  const resMinusOne = gridResolution - 1;

  let minHeight = Infinity;
  let maxHeight = -Infinity;

  for (let gy = 0; gy < gridResolution; gy++) {
    const wy = gy / resMinusOne;
    const rowOffset = gy * gridResolution;

    for (let gx = 0; gx < gridResolution; gx++) {
      const wx = gx / resMinusOne;

      // Lift term: distance from centroid
      let h = liftAlpha * euclideanDistance(wx, wy, centroid.x, centroid.y);

      // Gravitational wells: weighted Gaussian kernels at each city
      for (let i = 0; i < cities.length; i++) {
        const dx = wx - cities[i].x;
        const dy = wy - cities[i].y;
        const distSq = dx * dx + dy * dy;
        h -= weights[i] * Math.exp(-distSq * invTwoSigmaSq);
      }

      heightField[rowOffset + gx] = h;

      if (h < minHeight) minHeight = h;
      if (h > maxHeight) maxHeight = h;
    }
  }

  return { heightField, gridResolution, minHeight, maxHeight };
}
