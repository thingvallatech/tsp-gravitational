import type { City, SurfaceData } from '@/lib/types';
import type { AlgoResult } from './types';
import { ALGORITHM_REGISTRY } from './registry';
import { tourLength } from './tour-utils';

/**
 * Run a TSP algorithm by id, returning timed results.
 * Throws if algoId is not found in ALGORITHM_REGISTRY.
 */
export function runAlgorithm(algoId: string, cities: City[], surfaceData?: SurfaceData): AlgoResult {
  const algo = ALGORITHM_REGISTRY.find(a => a.id === algoId);
  if (!algo) {
    throw new Error(`Algorithm "${algoId}" not found in registry`);
  }

  const start = performance.now();
  const steps = algo.solve(cities, surfaceData);
  const computeTimeMs = performance.now() - start;

  const finalTour = steps.length > 0 ? steps[steps.length - 1].tour : [];
  const finalLength = finalTour.length >= 2 ? tourLength(cities, finalTour) : 0;

  return {
    algoId,
    steps,
    finalTour,
    tourLength: finalLength,
    computeTimeMs,
  };
}
