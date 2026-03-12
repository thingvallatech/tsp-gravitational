'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import HeightFieldMesh from './HeightFieldMesh';
import CityMarkers3D from './CityMarkers3D';

export default function HeightFieldScene() {
  return (
    <div className="w-full h-[500px]">
      <Canvas camera={{ position: [0.5, 0.8, 1.2], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <HeightFieldMesh />
        <CityMarkers3D />
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          minDistance={0.3}
          maxDistance={3}
        />
      </Canvas>
    </div>
  );
}
