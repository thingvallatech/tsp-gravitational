import { City, PresetName, DEFAULT_CITY_COUNT } from './types';
import { mulberry32 } from './prng';

/**
 * Generate an array of cities based on a named preset pattern.
 * Uses a seeded PRNG so the same seed + preset always produces identical output.
 */
export function generateCities(
  preset: PresetName,
  seed: number,
  count: number = DEFAULT_CITY_COUNT
): City[] {
  const rng = mulberry32(seed);
  switch (preset) {
    case 'random':    return generateRandom(rng, count);
    case 'clustered': return generateClustered(rng, count);
    case 'circular':  return generateCircular(rng, count);
    case 'grid':      return generateGrid(rng, count);
    case 'star':      return generateStar(rng, count);
    case 'spiral':    return generateSpiral(rng, count);
  }
}

/** Clamp value to [0, 1] */
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Uniformly distributed cities with margin from edges */
function generateRandom(rng: () => number, count: number): City[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: rng() * 0.8 + 0.1,
    y: rng() * 0.8 + 0.1,
  }));
}

/** Cities grouped into 3-5 clusters with 0.15 spread */
function generateClustered(rng: () => number, count: number): City[] {
  const numClusters = 3 + Math.floor(rng() * 3); // 3-5 clusters
  const clusterCenters = Array.from({ length: numClusters }, () => ({
    x: rng() * 0.6 + 0.2,
    y: rng() * 0.6 + 0.2,
  }));

  const cities: City[] = [];
  for (let i = 0; i < count; i++) {
    const center = clusterCenters[Math.floor(rng() * numClusters)];
    cities.push({
      id: i,
      x: clamp01(center.x + (rng() - 0.5) * 0.15),
      y: clamp01(center.y + (rng() - 0.5) * 0.15),
    });
  }
  return cities;
}

/** Cities evenly spaced on a circle with slight radial jitter */
function generateCircular(rng: () => number, count: number): City[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count;
    const radius = 0.35 + rng() * 0.05;
    return {
      id: i,
      x: clamp01(0.5 + radius * Math.cos(angle)),
      y: clamp01(0.5 + radius * Math.sin(angle)),
    };
  });
}

/** Cities on a square grid with slight position jitter */
function generateGrid(rng: () => number, count: number): City[] {
  const side = Math.ceil(Math.sqrt(count));
  const cities: City[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % side;
    const row = Math.floor(i / side);
    cities.push({
      id: i,
      x: clamp01(0.15 + (col / Math.max(side - 1, 1)) * 0.7 + (rng() - 0.5) * 0.02),
      y: clamp01(0.15 + (row / Math.max(side - 1, 1)) * 0.7 + (rng() - 0.5) * 0.02),
    });
  }
  return cities;
}

/** 5-armed star pattern with cities along arms */
function generateStar(rng: () => number, count: number): City[] {
  const cities: City[] = [];
  const points = 5;
  for (let i = 0; i < count; i++) {
    const arm = i % points;
    const angle = (2 * Math.PI * arm) / points;
    const t = rng() * 0.35;
    cities.push({
      id: i,
      x: clamp01(0.5 + t * Math.cos(angle) + (rng() - 0.5) * 0.03),
      y: clamp01(0.5 + t * Math.sin(angle) + (rng() - 0.5) * 0.03),
    });
  }
  return cities;
}

/** Cities along a 2-rotation spiral from center outward */
function generateSpiral(rng: () => number, count: number): City[] {
  return Array.from({ length: count }, (_, i) => {
    const t = i / count;
    const angle = t * 4 * Math.PI; // 2 full rotations
    const radius = 0.05 + t * 0.35;
    return {
      id: i,
      x: clamp01(0.5 + radius * Math.cos(angle) + (rng() - 0.5) * 0.02),
      y: clamp01(0.5 + radius * Math.sin(angle) + (rng() - 0.5) * 0.02),
    };
  });
}
