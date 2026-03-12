'use client';

import { useStore } from '../store';

export default function StepNarration() {
  const selectedAlgoId = useStore((s) => s.selectedAlgoId);
  const result = useStore((s) => selectedAlgoId ? s.algorithmResults[selectedAlgoId] : undefined);
  const step = useStore((s) => selectedAlgoId ? (s.playbackStep[selectedAlgoId] ?? 0) : 0);

  if (!result || !result.steps.length) {
    return (
      <div className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-sm text-gray-500">
        Select an algorithm and click Run
      </div>
    );
  }

  const currentStep = result.steps[Math.min(step, result.steps.length - 1)];

  return (
    <div className="w-full bg-gray-800 border border-gray-700 rounded p-3 space-y-1">
      <p className="text-sm text-gray-200">{currentStep.description}</p>
      <p className="text-xs text-gray-400">Tour length: {currentStep.cost.toFixed(4)}</p>
    </div>
  );
}
