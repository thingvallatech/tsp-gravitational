'use client';

import { useState, useCallback } from 'react';
import { useStore } from '../store';
import { ALGORITHM_REGISTRY } from '../algorithms/registry';
import { runAlgorithm } from '../algorithms/runner';
import AlgoTile from './AlgoTile';
import Leaderboard from './Leaderboard';

export default function GalleryPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleRunAll = useCallback(() => {
    const { cities, surfaceData } = useStore.getState();
    if (cities.length === 0) return;

    setIsRunning(true);
    setProgress(0);
    useStore.getState().clearAlgorithmResults();

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
      setProgress(index);

      // Yield to the event loop so React can re-render between solves
      setTimeout(runNext, 0);
    };

    setTimeout(runNext, 0);
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
            ? `Running... (${progress}/${ALGORITHM_REGISTRY.length})`
            : 'Run All Algorithms'}
        </button>
        {isRunning && (
          <div className="h-2 flex-1 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-200"
              style={{ width: `${(progress / ALGORITHM_REGISTRY.length) * 100}%` }}
            />
          </div>
        )}
      </div>

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
    </div>
  );
}
