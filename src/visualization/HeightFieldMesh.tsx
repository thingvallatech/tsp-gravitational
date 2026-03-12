'use client';

import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';
import { heightToVertexColors } from './color-scales';

export default function HeightFieldMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const surfaceData = useStore((s) => s.surfaceData);

  const segments = useMemo(() => {
    if (!surfaceData) return 1;
    return surfaceData.gridResolution - 1;
  }, [surfaceData]);

  useEffect(() => {
    if (!surfaceData || !meshRef.current) return;

    const { heightField, gridResolution, minHeight, maxHeight } = surfaceData;
    const geometry = meshRef.current.geometry as THREE.PlaneGeometry;
    const position = geometry.getAttribute('position') as THREE.BufferAttribute;
    const range = maxHeight - minHeight || 1;

    // Displace Z (which becomes Y after rotation) from heightField
    for (let i = 0; i < position.count; i++) {
      const normalizedH = (heightField[i] - minHeight) / range;
      position.setZ(i, normalizedH * 0.3);
    }
    position.needsUpdate = true;

    // Vertex colors
    const colors = heightToVertexColors(heightField, minHeight, maxHeight);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    geometry.computeVertexNormals();
  }, [surfaceData]);

  if (!surfaceData) return null;

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1, 1, segments, segments]} />
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} />
    </mesh>
  );
}
