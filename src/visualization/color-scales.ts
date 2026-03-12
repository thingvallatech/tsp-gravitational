import { interpolateViridis } from 'd3-scale-chromatic';

/**
 * Map a normalized height [0,1] to an RGB triple using Viridis colormap.
 */
export function heightToColor(normalizedHeight: number): [number, number, number] {
  const css = interpolateViridis(normalizedHeight);
  // interpolateViridis returns "rgb(r, g, b)" string
  const m = css.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return [0, 0, 0];
  return [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255];
}

/**
 * Convert a height field to a flat Float32Array of vertex colors (RGB, length = n*3).
 * Inverted domain: low heights (wells) = dark, high heights (ridges) = bright.
 */
export function heightToVertexColors(
  heightField: Float32Array,
  minHeight: number,
  maxHeight: number,
): Float32Array {
  const n = heightField.length;
  const colors = new Float32Array(n * 3);
  const range = maxHeight - minHeight || 1;

  for (let i = 0; i < n; i++) {
    const t = (heightField[i] - minHeight) / range; // 0 = min (well), 1 = max (ridge)
    const [r, g, b] = heightToColor(t);
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  return colors;
}
