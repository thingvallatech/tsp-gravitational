'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useStore } from '../store';

/**
 * Synchronized playback hook that drives ALL algorithms on a shared timeline.
 * Uses delta-time accumulation (same pattern as usePlayback.ts) but normalizes
 * step indices so algorithms with fewer steps finish proportionally earlier.
 */
export function useSyncPlayback() {
  const accumulatedRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const tickRef = useRef(0);

  const [isPlaying, setIsPlayingLocal] = useState(false);
  const [progress, setProgress] = useState(0);

  const play = useCallback(() => {
    setIsPlayingLocal(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlayingLocal(false);
  }, []);

  const reset = useCallback(() => {
    setIsPlayingLocal(false);
    tickRef.current = 0;
    setProgress(0);

    // Reset all algorithm playback steps to 0
    const state = useStore.getState();
    const results = state.algorithmResults;
    for (const algoId of Object.keys(results)) {
      state.setPlaybackStep(algoId, 0);
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    accumulatedRef.current = 0;
    lastTimeRef.current = 0;

    const tick = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const deltaMs = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      accumulatedRef.current += deltaMs;

      const state = useStore.getState();
      const speed = state.playbackSpeed;
      const results = state.algorithmResults;
      const algoIds = Object.keys(results);

      if (algoIds.length === 0) {
        setIsPlayingLocal(false);
        return;
      }

      // Find max steps across all algorithms
      let maxSteps = 0;
      for (const id of algoIds) {
        const len = results[id].steps.length;
        if (len > maxSteps) maxSteps = len;
      }

      if (maxSteps === 0) {
        setIsPlayingLocal(false);
        return;
      }

      // Advance shared tick count based on accumulated time
      let currentTick = tickRef.current;
      while (accumulatedRef.current >= speed && currentTick < maxSteps) {
        accumulatedRef.current -= speed;
        currentTick += 1;
      }
      tickRef.current = currentTick;

      // Normalize step for each algorithm: proportional mapping on shared 0-1 timeline
      const fraction = Math.min(currentTick / maxSteps, 1);
      setProgress(fraction);

      for (const id of algoIds) {
        const totalSteps = results[id].steps.length;
        const normalizedStep = Math.min(
          Math.floor(fraction * totalSteps),
          totalSteps - 1
        );
        state.setPlaybackStep(id, normalizedStep);
      }

      // When timeline is complete, set all to final step and stop
      if (currentTick >= maxSteps) {
        for (const id of algoIds) {
          state.setPlaybackStep(id, results[id].steps.length - 1);
        }
        setProgress(1);
        setIsPlayingLocal(false);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying]);

  return { play, pause, reset, isPlaying, progress };
}
