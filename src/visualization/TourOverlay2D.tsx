'use client';

import { useRef, useEffect } from 'react';
import { useStore } from '../store';
import { ALGORITHM_REGISTRY } from '../algorithms/registry';

interface TourOverlay2DProps {
  canvasSize?: number;
}

export default function TourOverlay2D({ canvasSize = 500 }: TourOverlay2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cities = useStore((s) => s.cities);
  const selectedAlgoId = useStore((s) => s.selectedAlgoId);
  const result = useStore((s) => selectedAlgoId ? s.algorithmResults[selectedAlgoId] : undefined);
  const step = useStore((s) => selectedAlgoId ? (s.playbackStep[selectedAlgoId] ?? 0) : 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    if (!result || !result.steps.length || cities.length === 0) return;

    const currentStep = result.steps[Math.min(step, result.steps.length - 1)];
    const algo = ALGORITHM_REGISTRY.find((a) => a.id === result.algoId);
    const color = algo?.color ?? '#ffffff';

    // Draw tour edges
    const tour = currentStep.tour;
    if (tour.length >= 2) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      const first = cities[tour[0]];
      ctx.moveTo(first.x * canvasSize, first.y * canvasSize);
      for (let i = 1; i < tour.length; i++) {
        const c = cities[tour[i]];
        ctx.lineTo(c.x * canvasSize, c.y * canvasSize);
      }
      // Close the tour only when complete
      if (tour.length === cities.length) {
        ctx.lineTo(first.x * canvasSize, first.y * canvasSize);
      }
      ctx.stroke();
    }

    // Highlight edges from this step (thicker)
    if (currentStep.edges && currentStep.edges.length > 0) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1.0;
      for (const [a, b] of currentStep.edges) {
        const ca = cities[a];
        const cb = cities[b];
        if (ca && cb) {
          ctx.beginPath();
          ctx.moveTo(ca.x * canvasSize, ca.y * canvasSize);
          ctx.lineTo(cb.x * canvasSize, cb.y * canvasSize);
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1.0;

    // Draw city dots on top
    for (const city of cities) {
      const cx = city.x * canvasSize;
      const cy = city.y * canvasSize;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4444';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [result, step, cities, canvasSize, selectedAlgoId]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      className="absolute top-0 left-0 pointer-events-none"
    />
  );
}
