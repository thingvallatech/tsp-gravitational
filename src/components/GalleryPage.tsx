'use client';

import { useState, useCallback } from 'react';
import { useStore } from '../store';
import { ALGORITHM_REGISTRY } from '../algorithms/registry';
import { runAlgorithm } from '../algorithms/runner';
import { useSyncPlayback } from '../animation/useSyncPlayback';
import AlgoTile from './AlgoTile';
import Leaderboard from './Leaderboard';
import BatchComparison from './BatchComparison';

export default function GalleryPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);

  const { play, pause, reset, isPlaying, progress } = useSyncPlayback();
  const playbackSpeed = useStore((s) => s.playbackSpeed);
  const hasResults = useStore((s) => Object.keys(s.algorithmResults).length > 0);

  const handleRunAll = useCallback(() => {
    const { cities, surfaceData } = useStore.getState();
    if (cities.length === 0) return;

    setIsRunning(true);
    setRunProgress(0);
    useStore.getState().clearAlgorithmResults();
    reset();

    const algos = [...ALGORITHM_REGISTRY];
    let index = 0;

    const runNext = () => {
      if (index >= algos.length) {
        setIsRunning(false);
        return;
      }

      const algo = algos[index];
      try {
        const result = runAlgorithm(algo.id, cities, surfaceData ?? undefined);
        useStore.getState().setAlgorithmResult(algo.id, result);
        // Set playback to final step so the completed tour is shown
        useStore.getState().setPlaybackStep(algo.id, result.steps.length - 1);
      } catch (err) {
        console.error(`Algorithm ${algo.id} failed:`, err);
      }

      index++;
      setRunProgress(index);

      // Yield to the event loop so React can re-render between solves
      setTimeout(runNext, 0);
    };

    setTimeout(runNext, 0);
  }, [reset]);

  const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    useStore.getState().setPlaybackSpeed(Number(e.target.value));
  }, []);

  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <button
          onClick={handleRunAll}
          disabled={isRunning}
          className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
            isRunning
              ? 'bg-slate-700 cursor-not-allowed text-slate-400'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
          }`}
        >
          {isRunning
            ? `Running... (${runProgress}/${ALGORITHM_REGISTRY.length})`
            : 'Run All Algorithms'}
        </button>

        {isRunning && (
          <div className="h-2 flex-1 min-w-[120px] bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-200 rounded-full"
              style={{ width: `${(runProgress / ALGORITHM_REGISTRY.length) * 100}%` }}
            />
          </div>
        )}

        {hasResults && !isRunning && (
          <>
            <div className="h-6 w-px bg-slate-600 mx-1" />
            <button
              onClick={isPlaying ? pause : play}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 transition-colors text-white"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-600 hover:bg-slate-500 transition-colors"
            >
              Reset
            </button>

            {/* Progress */}
            <div className="flex-1 min-w-[100px] h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-100 rounded-full"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 tabular-nums w-10 text-right">
              {Math.round(progress * 100)}%
            </span>

            {/* Speed slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Speed</span>
              <input
                type="range"
                min="20"
                max="500"
                step="10"
                value={playbackSpeed}
                onChange={handleSpeedChange}
                className="w-20 accent-blue-500"
                style={{ direction: 'rtl' }}
              />
            </div>
          </>
        )}
      </div>

      {/* Algorithm grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
        {ALGORITHM_REGISTRY.map((algo) => (
          <AlgoTile key={algo.id} algoId={algo.id} />
        ))}
      </div>

      {/* Leaderboard & Batch side by side on large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h2 className="text-base font-semibold mb-3 text-slate-300">Leaderboard</h2>
          <Leaderboard />
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h2 className="text-base font-semibold mb-3 text-slate-300">Batch Comparison</h2>
          <BatchComparison />
        </div>
      </div>
    </div>
  );
}
