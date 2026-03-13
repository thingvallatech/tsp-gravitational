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
      <div className="w-full h-[500px] flex items-center justify-center bg-slate-800 rounded-xl">
        <span className="text-slate-400">Loading 3D scene...</span>
      </div>
    ),
  },
);

const PRESETS: PresetName[] = ['random', 'clustered', 'circular', 'grid', 'star', 'spiral'];

export default function Home() {
  const [preset, setPreset] = useState<PresetName>('random');
  const [seed, setSeed] = useState(42);
  const [activeTab, setActiveTab] = useState<'explorer' | 'gallery'>('gallery');
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
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className={`mx-auto px-4 py-3 flex items-center gap-6 ${activeTab === 'gallery' ? 'max-w-7xl' : 'max-w-4xl'}`}>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap">
            TSP Gravitational Solver
          </h1>

          {/* City controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as PresetName)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              {PRESETS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Seed</span>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm w-20 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              className="bg-blue-600 hover:bg-blue-500 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors"
            >
              Generate
            </button>

            <span className="text-xs text-slate-500 tabular-nums">{cityCount} cities</span>
          </div>

          {/* Tab toggle */}
          <div className="flex gap-1 ml-auto bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('explorer')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'explorer' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Explorer
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'gallery' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Gallery
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className={`mx-auto px-4 py-6 ${activeTab === 'gallery' ? 'max-w-7xl' : 'max-w-4xl'}`}>
        {activeTab === 'explorer' ? (
          <div className="space-y-6">
            {/* Algorithm panel */}
            <section>
              <h2 className="text-base font-semibold mb-2 text-slate-300">Algorithm</h2>
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
              <h2 className="text-base font-semibold mb-2 text-slate-300">3D Gravitational Surface</h2>
              <HeightFieldScene />
            </section>

            {/* 2D Heatmap with tour overlay */}
            <section>
              <h2 className="text-base font-semibold mb-2 text-slate-300">2D Heatmap</h2>
              <div className="relative inline-block">
                <Heatmap2D />
                <TourOverlay2D />
              </div>
            </section>
          </div>
        ) : (
          <GalleryPage />
        )}
      </main>
    </div>
  );
}
