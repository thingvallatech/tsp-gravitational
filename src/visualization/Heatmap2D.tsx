'use client';

import { useRef, useEffect } from 'react';
import { scaleSequential } from 'd3-scale';
import { interpolateViridis } from 'd3-scale-chromatic';
import { contours } from 'd3-contour';
import { geoPath } from 'd3-geo';
import { useStore } from '../store';

const CANVAS_SIZE = 500;

export default function Heatmap2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceData = useStore((s) => s.surfaceData);
  const cities = useStore((s) => s.cities);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !surfaceData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { heightField, gridResolution, minHeight, maxHeight } = surfaceData;

    // --- Heatmap ---
    // Color scale: inverted so wells (low) are dark, ridges (high) are bright
    const colorScale = scaleSequential(interpolateViridis).domain([maxHeight, minHeight]);

    // Render at grid resolution then scale up
    const offscreen = new OffscreenCanvas(gridResolution, gridResolution);
    const offCtx = offscreen.getContext('2d')!;
    const imageData = offCtx.createImageData(gridResolution, gridResolution);
    const data = imageData.data;

    for (let i = 0; i < heightField.length; i++) {
      const css = colorScale(heightField[i]);
      const m = css.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (m) {
        data[i * 4] = Number(m[1]);
        data[i * 4 + 1] = Number(m[2]);
        data[i * 4 + 2] = Number(m[3]);
        data[i * 4 + 3] = 255;
      }
    }

    offCtx.putImageData(imageData, 0, 0);

    // Scale to canvas size
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(offscreen, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // --- Contour lines ---
    const contourGenerator = contours()
      .size([gridResolution, gridResolution])
      .thresholds(15);

    const contourData = contourGenerator(heightField as unknown as number[]);

    const scale = CANVAS_SIZE / gridResolution;
    ctx.save();
    ctx.scale(scale, scale);

    const pathGen = geoPath(null, ctx);

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 0.5 / scale;

    for (const contour of contourData) {
      ctx.beginPath();
      pathGen(contour);
      ctx.stroke();
    }

    ctx.restore();

    // --- City dots ---
    for (const city of cities) {
      const cx = city.x * CANVAS_SIZE;
      const cy = city.y * CANVAS_SIZE;

      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4444';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [surfaceData, cities]);

  if (!surfaceData) return null;

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      className="rounded border border-gray-700"
    />
  );
}
