'use client';

import { useState, useEffect } from 'react';
import CityCanvas from '../components/CityCanvas';
import { useStore } from '../store';
import { PresetName } from '../lib/types';

const PRESETS: PresetName[] = ['random', 'clustered', 'circular', 'grid', 'star', 'spiral'];

export default function Home() {
  const [preset, setPreset] = useState<PresetName>('random');
  const [seed, setSeed] = useState(42);
  const cityCount = useStore((s) => s.cities.length);

  // Auto-generate on first mount
  useEffect(() => {
    useStore.getState().setCities('random', 42);
  }, []);

  const handleGenerate = () => {
    useStore.getState().setCities(preset, seed);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10">
      <h1 className="text-3xl font-bold mb-6">TSP Gravitational Surface Solver</h1>

      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Preset</span>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as PresetName)}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm"
          >
            {PRESETS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Seed</span>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm w-24"
          />
        </label>

        <button
          onClick={handleGenerate}
          className="bg-blue-600 hover:bg-blue-700 rounded px-4 py-1.5 text-sm font-medium transition-colors"
        >
          Generate
        </button>
      </div>

      <CityCanvas />

      <p className="mt-3 text-sm text-gray-500">Cities: {cityCount}</p>
    </div>
  );
}
