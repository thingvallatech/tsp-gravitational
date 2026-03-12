'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { City } from '../lib/types';

const CANVAS_SIZE = 600;
const BG_COLOR = '#1a1a2e';
const GRID_COLOR = 'rgba(255, 255, 255, 0.08)';
const TEXT_COLOR = 'rgba(255, 255, 255, 0.8)';
const DOT_RADIUS = 6;

export default function CityCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cities = useStore((s) => s.cities);

  const draw = useCallback((cityList: City[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear with dark background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    // Draw subtle grid at 0.25 intervals
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const pos = (i / 4) * w;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(w, pos);
      ctx.stroke();
    }

    // Handle empty state
    if (cityList.length === 0) {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No cities generated', w / 2, h / 2);
      return;
    }

    // Draw cities
    const total = cityList.length;
    for (let i = 0; i < total; i++) {
      const city = cityList[i];
      const cx = city.x * w;
      const cy = city.y * h;

      // Colored dot using HSL gradient based on index
      const hue = (i / total) * 360;
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
      ctx.beginPath();
      ctx.arc(cx, cy, DOT_RADIUS, 0, 2 * Math.PI);
      ctx.fill();

      // City ID label
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(String(city.id), cx + DOT_RADIUS + 2, cy + 3);
    }

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, h);
  }, []);

  useEffect(() => {
    draw(cities);
  }, [cities, draw]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      className="border border-gray-700 rounded"
    />
  );
}
