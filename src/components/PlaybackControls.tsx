'use client';

import { useStore } from '../store';
import { usePlayback } from '../animation/usePlayback';

export default function PlaybackControls() {
  const selectedAlgoId = useStore((s) => s.selectedAlgoId);
  const playbackSpeed = useStore((s) => s.playbackSpeed);
  const {
    currentStep,
    totalSteps,
    isPlaying,
    play,
    pause,
    stepForward,
    stepBackward,
    reset,
  } = usePlayback(selectedAlgoId);

  const hasResult = totalSteps > 0;
  const atStart = currentStep === 0;
  const atEnd = currentStep >= totalSteps - 1;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-3">
        <button
          onClick={isPlaying ? pause : play}
          disabled={!hasResult || atEnd}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded px-3 py-1.5 text-sm font-mono transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '| |' : '>>'}
        </button>

        <button
          onClick={stepBackward}
          disabled={!hasResult || atStart}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded px-3 py-1.5 text-sm font-mono transition-colors"
          title="Step backward"
        >
          {'<'}
        </button>

        <button
          onClick={stepForward}
          disabled={!hasResult || atEnd}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded px-3 py-1.5 text-sm font-mono transition-colors"
          title="Step forward"
        >
          {'>'}
        </button>

        <button
          onClick={reset}
          disabled={!hasResult}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded px-3 py-1.5 text-sm font-mono transition-colors"
          title="Reset"
        >
          {'<<'}
        </button>

        <span className="text-sm text-gray-300 font-mono ml-2">
          {hasResult ? `Step ${currentStep + 1} / ${totalSteps}` : 'No result'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs text-gray-400">Speed</label>
        <input
          type="range"
          min={50}
          max={1000}
          step={50}
          value={playbackSpeed}
          onChange={(e) => useStore.getState().setPlaybackSpeed(Number(e.target.value))}
          className="flex-1 accent-blue-500"
          disabled={!hasResult}
        />
        <span className="text-xs text-gray-400 w-14 text-right">{playbackSpeed}ms</span>
      </div>
    </div>
  );
}
