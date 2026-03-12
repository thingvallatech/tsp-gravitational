'use client';

import { useState } from 'react';
import { useStore } from '../store';
import { ALGORITHM_REGISTRY } from '../algorithms/registry';
import { runAlgorithm } from '../algorithms/runner';
import type { AlgorithmCategory } from '../algorithms/types';

const CATEGORY_ORDER: AlgorithmCategory[] = ['construction', 'improvement', 'metaheuristic', 'novel'];
const CATEGORY_LABELS: Record<AlgorithmCategory, string> = {
  construction: 'Construction',
  improvement: 'Improvement',
  metaheuristic: 'Metaheuristic',
  novel: 'Novel',
};

export default function AlgorithmPanel() {
  const [localAlgoId, setLocalAlgoId] = useState(ALGORITHM_REGISTRY[0].id);
  const [isRunning, setIsRunning] = useState(false);
  const selectedAlgoId = useStore((s) => s.selectedAlgoId);
  const result = useStore((s) => selectedAlgoId ? s.algorithmResults[selectedAlgoId] : undefined);

  const selectedAlgo = ALGORITHM_REGISTRY.find((a) => a.id === localAlgoId);

  const handleRun = () => {
    const store = useStore.getState();
    const { cities, surfaceData } = store;
    if (cities.length === 0) return;

    setIsRunning(true);
    try {
      const algoResult = runAlgorithm(localAlgoId, cities, surfaceData ?? undefined);
      store.setAlgorithmResult(localAlgoId, algoResult);
      store.setPlaybackStep(localAlgoId, 0);
      store.setSelectedAlgoId(localAlgoId);
      store.setIsPlaying(false);
    } finally {
      setIsRunning(false);
    }
  };

  // Group algorithms by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    algorithms: ALGORITHM_REGISTRY.filter((a) => a.category === cat),
  }));

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-3">
        <select
          value={localAlgoId}
          onChange={(e) => setLocalAlgoId(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm flex-1"
        >
          {grouped.map((group) => (
            <optgroup key={group.category} label={group.label}>
              {group.algorithms.map((algo) => (
                <option key={algo.id} value={algo.id}>
                  {algo.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <span
          className="inline-block w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: selectedAlgo?.color }}
        />

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap"
        >
          {isRunning ? 'Running...' : 'Run'}
        </button>
      </div>

      {selectedAlgo && (
        <p className="text-xs text-gray-400">{selectedAlgo.description}</p>
      )}

      {result && (
        <div className="flex gap-4 text-xs text-gray-300">
          <span>Time: {result.computeTimeMs.toFixed(1)}ms</span>
          <span>Tour length: {result.tourLength.toFixed(4)}</span>
          <span>Steps: {result.steps.length}</span>
        </div>
      )}
    </div>
  );
}
