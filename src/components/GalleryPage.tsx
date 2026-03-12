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
      const result = runAlgorithm(algo.id, cities, surfaceData ?? undefined);
      useStore.getState().setAlgorithmResult(algo.id, result);
      // Set playback to final step so the completed tour is shown
      useStore.getState().setPlaybackStep(algo.id, result.steps.length - 1);

      index++;
      setRunProgress(index);

      // Yield to the event loop so React can re-render between solves
      setTimeout(runNext, 0);
    };

    setTimeout(runNext, 0);
  }, [reset]);

  const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Slider range: fast (50ms) to slow (500ms)
    useStore.getState().setPlaybackSpeed(Number(e.target.value));
  }, []);

  return (
    <div className="space-y-6">
      {/* Run All button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleRunAll}
          disabled={isRunning}
          className={`px-5 py-2 rounded font-medium text-sm transition-colors ${
            isRunning
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isRunning
            ? `Running... (${runProgress}/${ALGORITHM_REGISTRY.length})`
            : 'Run All Algorithms'}
        </button>
        {isRunning && (
          <div className="h-2 flex-1 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-200"
              style={{ width: `${(runProgress / ALGORITHM_REGISTRY.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Sync playback controls */}
      {hasResults && (
        <div className="flex items-center gap-4 bg-gray-800 rounded-lg px-4 py-3">
          <button
            onClick={isPlaying ? pause : play}
            className="px-4 py-1.5 rounded text-sm font-medium bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={reset}
            className="px-4 py-1.5 rounded text-sm font-medium bg-gray-600 hover:bg-gray-500 transition-colors"
          >
            Reset
          </button>

          {/* Progress bar */}
          <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-10 text-right">
            {Math.round(progress * 100)}%
          </span>

          {/* Speed slider */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Speed</span>
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
        </div>
      )}

      {/* Algorithm grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ALGORITHM_REGISTRY.map((algo) => (
          <AlgoTile key={algo.id} algoId={algo.id} />
        ))}
      </div>

      {/* Leaderboard */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Leaderboard</h2>
        <Leaderboard />
      </div>

      {/* Batch Comparison */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Batch Comparison</h2>
        <BatchComparison />
      </div>
    </div>
  );
}
