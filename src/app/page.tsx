'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Heatmap2D from '../visualization/Heatmap2D';
import TourOverlay2D from '../visualization/TourOverlay2D';
import AlgorithmPanel from '../components/AlgorithmPanel';
import PlaybackControls from '../components/PlaybackControls';
import StepNarration from '../components/StepNarration';
import GalleryPage from '../components/GalleryPage';
import { useStore } from '../store';
import { PresetName } from '../lib/types';

const HeightFieldScene = dynamic(
  () => import('../visualization/HeightFieldScene'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] flex items-center justify-center bg-gray-800 rounded">
        <span className="text-gray-400">Loading 3D scene...</span>
      </div>
    ),
  },
);

const PRESETS: PresetName[] = ['random', 'clustered', 'circular', 'grid', 'star', 'spiral'];

export default function Home() {
  const [preset, setPreset] = useState<PresetName>('random');
  const [seed, setSeed] = useState(42);
  const [activeTab, setActiveTab] = useState<'explorer' | 'gallery'>('explorer');
  const cityCount = useStore((s) => s.cities.length);

  // Auto-generate on first mount
  useEffect(() => {
    useStore.getState().setCities('random', 42);
  }, []);

  const handleGenerate = () => {
    useStore.getState().setCities(preset, seed);
    useStore.getState().clearAlgorithmResults();
    useStore.getState().setSelectedAlgoId(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10">
      <h1 className="text-3xl font-bold mb-6">TSP Gravitational Surface Solver</h1>

      <div className={`w-full mx-auto space-y-6 px-4 ${activeTab === 'gallery' ? 'max-w-6xl' : 'max-w-3xl'}`}>
        {/* City controls */}
        <section>
          <div className="flex items-center gap-4">
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

            <span className="text-sm text-gray-500">Cities: {cityCount}</span>
          </div>
        </section>

        {/* Tab toggle */}
        <section>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('explorer')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === 'explorer' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Explorer
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === 'gallery' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Gallery
            </button>
          </div>
        </section>

        {activeTab === 'explorer' ? (
          <>
            {/* Algorithm panel */}
            <section>
              <h2 className="text-lg font-semibold mb-2">Algorithm</h2>
              <AlgorithmPanel />
            </section>

            {/* Playback controls */}
            <section>
              <PlaybackControls />
            </section>

            {/* Step narration */}
            <section>
              <StepNarration />
            </section>

            {/* 3D Gravitational Surface */}
            <section>
              <h2 className="text-lg font-semibold mb-2">3D Gravitational Surface</h2>
              <HeightFieldScene />
            </section>

            {/* 2D Heatmap with tour overlay */}
            <section>
              <h2 className="text-lg font-semibold mb-2">2D Heatmap</h2>
              <div className="relative inline-block">
                <Heatmap2D />
                <TourOverlay2D />
              </div>
            </section>
          </>
        ) : (
          <GalleryPage />
        )}
      </div>
    </div>
  );
}
