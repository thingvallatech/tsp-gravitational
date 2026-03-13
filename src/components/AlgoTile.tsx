'use client';

import { useRef, useEffect } from 'react';
import { useStore } from '../store';
import { ALGORITHM_REGISTRY } from '../algorithms/registry';

interface AlgoTileProps {
  algoId: string;
}

const TILE_CANVAS_SIZE = 300;

export default function AlgoTile({ algoId }: AlgoTileProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const algo = ALGORITHM_REGISTRY.find((a) => a.id === algoId);
  const cities = useStore((s) => s.cities);
  const result = useStore((s) => s.algorithmResults[algoId]);
  const step = useStore((s) => s.playbackStep[algoId] ?? 0);

  const color = algo?.color ?? '#ffffff';
  const name = algo?.name ?? algoId;
  const category = algo?.category ?? '';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = TILE_CANVAS_SIZE;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    // Dark background with subtle grid
    ctx.fillStyle = '#0f1729';
    ctx.fillRect(0, 0, size, size);

    // Subtle grid lines
    ctx.strokeStyle = '#1a2744';
    ctx.lineWidth = 0.5;
    const gridStep = size / 8;
    for (let i = 1; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridStep, 0);
      ctx.lineTo(i * gridStep, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * gridStep);
      ctx.lineTo(size, i * gridStep);
      ctx.stroke();
    }

    const pad = 16;
    const drawSize = size - pad * 2;

    if (!result || !result.steps.length || cities.length === 0) {
      ctx.fillStyle = '#374151';
      ctx.font = '13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting...', size / 2, size / 2);
      return;
    }

    const currentStep = result.steps[Math.min(step, result.steps.length - 1)];
    const tour = currentStep.tour;

    // Draw tour edges with glow effect
    if (tour.length >= 2) {
      // Glow layer
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
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

      // Main line
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
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
    for (let i = 0; i < cities.length; i++) {
      const city = cities[i];
      const cx = city.x * drawSize + pad;
      const cy = city.y * drawSize + pad;
      const inTour = tour.includes(i);

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, inTour ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = inTour ? '#ffffff' : '#4b5563';
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = inTour ? color : '#6b7280';
      ctx.fill();
    }
  }, [result, step, cities, color]);

  const isComplete = result && step >= result.steps.length - 1;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: `1px solid ${result ? color + '40' : '#334155'}`,
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${result ? color + '20' : '#1e293b'}` }}>
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color, boxShadow: result ? `0 0 6px ${color}60` : 'none' }}
        />
        <span className="text-sm font-medium text-gray-200 truncate">{name}</span>
        <span className="text-[10px] text-gray-500 ml-auto uppercase tracking-wider">{category}</span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={TILE_CANVAS_SIZE}
        height={TILE_CANVAS_SIZE}
        className="w-full"
        style={{ aspectRatio: '1/1', display: 'block' }}
      />

      {/* Stats footer */}
      <div className="px-3 py-2" style={{ borderTop: `1px solid ${result ? color + '20' : '#1e293b'}` }}>
        {result ? (
          <div className="space-y-1.5">
            {/* Progress bar */}
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${((step + 1) / result.steps.length) * 100}%`,
                  backgroundColor: color,
                  boxShadow: `0 0 4px ${color}80`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400">
                Tour: <span className="text-white font-mono">{result.tourLength.toFixed(3)}</span>
              </span>
              <span className="text-gray-400">
                <span className="text-white font-mono">{result.computeTimeMs.toFixed(1)}</span> ms
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400">
                Step <span className="text-white font-mono">{step + 1}/{result.steps.length}</span>
              </span>
              {isComplete && (
                <span className="text-green-400 text-[10px] font-medium">DONE</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-gray-500 text-center py-1">Not run</div>
        )}
      </div>
    </div>
  );
}
