'use client';

import { useRef, useEffect } from 'react';
import { useStore } from '../store';
import { ALGORITHM_REGISTRY } from '../algorithms/registry';

interface AlgoTileProps {
  algoId: string;
}

const TILE_CANVAS_SIZE = 200;

export default function AlgoTile({ algoId }: AlgoTileProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const algo = ALGORITHM_REGISTRY.find((a) => a.id === algoId);
  const cities = useStore((s) => s.cities);
  const result = useStore((s) => s.algorithmResults[algoId]);
  const step = useStore((s) => s.playbackStep[algoId] ?? 0);

  const color = algo?.color ?? '#ffffff';
  const name = algo?.name ?? algoId;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = TILE_CANVAS_SIZE;

    // Dark background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, size, size);

    if (!result || !result.steps.length || cities.length === 0) {
      // "Not run" text
      ctx.fillStyle = '#555';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Not run', size / 2, size / 2);
      return;
    }

    const currentStep = result.steps[Math.min(step, result.steps.length - 1)];
    const tour = currentStep.tour;

    // Draw tour edges
    if (tour.length >= 2) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      const pad = 10;
      const drawSize = size - pad * 2;
      const first = cities[tour[0]];
      ctx.moveTo(first.x * drawSize + pad, first.y * drawSize + pad);
      for (let i = 1; i < tour.length; i++) {
        const c = cities[tour[i]];
        ctx.lineTo(c.x * drawSize + pad, c.y * drawSize + pad);
      }
      if (tour.length === cities.length) {
        ctx.lineTo(first.x * drawSize + pad, first.y * drawSize + pad);
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;

    // Draw city dots
    const pad = 10;
    const drawSize = size - pad * 2;
    for (const city of cities) {
      const cx = city.x * drawSize + pad;
      const cy = city.y * drawSize + pad;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4444';
      ctx.fill();
    }
  }, [result, step, cities, color]);

  return (
    <div
      className="bg-gray-800 rounded-lg p-3"
      style={{ borderLeft: `3px solid ${result ? color : '#444'}` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-3 h-3 rounded-full inline-block flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium truncate">{name}</span>
      </div>

      <canvas
        ref={canvasRef}
        width={TILE_CANVAS_SIZE}
        height={TILE_CANVAS_SIZE}
        className="w-full rounded"
        style={{ aspectRatio: '1/1' }}
      />

      {result ? (
        <>
          {/* Per-algorithm progress bar */}
          <div className="mt-2 h-1 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full transition-all duration-100"
              style={{
                width: `${((step + 1) / result.steps.length) * 100}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-400 space-y-0.5">
            <div>Tour: <span className="text-white">{result.tourLength.toFixed(4)}</span></div>
            <div>Time: <span className="text-white">{result.computeTimeMs.toFixed(1)} ms</span></div>
            <div>Steps: <span className="text-white">{step + 1}/{result.steps.length}</span></div>
          </div>
        </>
      ) : (
        <div className="mt-2 text-xs text-gray-500">Not run</div>
      )}
    </div>
  );
}
