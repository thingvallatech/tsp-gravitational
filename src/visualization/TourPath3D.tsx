'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';
import { ALGORITHM_REGISTRY } from '../algorithms/registry';

export default function TourPath3D() {
  const cities = useStore((s) => s.cities);
  const surfaceData = useStore((s) => s.surfaceData);
  const selectedAlgoId = useStore((s) => s.selectedAlgoId);
  const result = useStore((s) => selectedAlgoId ? s.algorithmResults[selectedAlgoId] : undefined);
  const step = useStore((s) => selectedAlgoId ? (s.playbackStep[selectedAlgoId] ?? 0) : 0);

  const lineObj = useMemo(() => {
    const algo = selectedAlgoId ? ALGORITHM_REGISTRY.find((a) => a.id === selectedAlgoId) : null;
    const algoColor = algo?.color ?? '#ffffff';

    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ color: new THREE.Color(algoColor), linewidth: 2 });

    if (!result || !result.steps.length || !surfaceData || cities.length === 0) {
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
      return new THREE.Line(geometry, material);
    }

    const currentStep = result.steps[Math.min(step, result.steps.length - 1)];
    const tour = currentStep.tour;

    if (tour.length < 2) {
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
      return new THREE.Line(geometry, material);
    }

    const { heightField, gridResolution, minHeight, maxHeight } = surfaceData;
    const range = maxHeight - minHeight || 1;
    const resMinusOne = gridResolution - 1;

    const positions: number[] = [];

    const getPos = (cityIdx: number) => {
      const city = cities[cityIdx];
      const gx = Math.round(city.x * resMinusOne);
      const gy = Math.round(city.y * resMinusOne);
      const idx = gy * gridResolution + gx;
      const h = heightField[idx];
      const normalizedH = (h - minHeight) / range;
      const elevation = normalizedH * 0.3 + 0.005;
      return [city.x - 0.5, elevation, city.y - 0.5];
    };

    for (let i = 0; i < tour.length; i++) {
      const pos = getPos(tour[i]);
      positions.push(pos[0], pos[1], pos[2]);
    }

    // Close tour when complete
    if (tour.length === cities.length) {
      const pos = getPos(tour[0]);
      positions.push(pos[0], pos[1], pos[2]);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return new THREE.Line(geometry, material);
  }, [result, step, cities, surfaceData, selectedAlgoId]);

  if (!result) return null;

  return <primitive object={lineObj} />;
}
