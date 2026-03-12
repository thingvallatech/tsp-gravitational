/** City position in normalized [0, 1] coordinate space */
export interface City {
  id: number;
  x: number;  // [0, 1]
  y: number;  // [0, 1]
}

/** Available preset city configurations */
export type PresetName =
  | 'random'
  | 'clustered'
  | 'circular'
  | 'grid'
  | 'star'
  | 'spiral';

/** Parameters controlling the gravitational surface */
export interface SurfaceParams {
  kernelWidth: number;    // Gaussian sigma, controls well radius
  liftAlpha: number;      // Centerpoint lift strength
  gridResolution: number; // Height field grid size (e.g., 128)
}

/** Precomputed surface data */
export interface SurfaceData {
  heightField: Float32Array;  // Flat array, size = gridResolution^2
  gridResolution: number;
  minHeight: number;          // For normalization by renderers
  maxHeight: number;
}

/** Default surface parameters */
export const DEFAULT_SURFACE_PARAMS: SurfaceParams = {
  kernelWidth: 0.15,
  liftAlpha: 1.0,
  gridResolution: 128,
};

/** Default city count */
export const DEFAULT_CITY_COUNT = 20;

/** Default seed */
export const DEFAULT_SEED = 42;
