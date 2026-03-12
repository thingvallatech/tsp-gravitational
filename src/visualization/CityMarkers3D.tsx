'use client';

import { useMemo } from 'react';
import { useStore } from '../store';

export default function CityMarkers3D() {
  const cities = useStore((s) => s.cities);
  const surfaceData = useStore((s) => s.surfaceData);

  const markers = useMemo(() => {
    if (!surfaceData || cities.length === 0) return [];

    const { heightField, gridResolution, minHeight, maxHeight } = surfaceData;
    const range = maxHeight - minHeight || 1;
    const resMinusOne = gridResolution - 1;

    return cities.map((city) => {
      // Sample height at nearest grid point
      const gx = Math.round(city.x * resMinusOne);
      const gy = Math.round(city.y * resMinusOne);
      const idx = gy * gridResolution + gx;
      const h = heightField[idx];
      const normalizedH = (h - minHeight) / range;
      const elevation = normalizedH * 0.3; // match HeightFieldMesh scale

      return {
        id: city.id,
        // PlaneGeometry is centered at origin, so offset by -0.5
        position: [city.x - 0.5, elevation + 0.01, city.y - 0.5] as [number, number, number],
      };
    });
  }, [cities, surfaceData]);

  if (!surfaceData) return null;

  return (
    <group>
      {markers.map((m) => (
        <mesh key={m.id} position={m.position}>
          <sphereGeometry args={[0.012, 16, 16]} />
          <meshStandardMaterial color="#ff4444" />
        </mesh>
      ))}
    </group>
  );
}
