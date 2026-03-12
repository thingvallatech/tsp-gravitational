'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';

/**
 * Custom hook that drives algorithm animation via requestAnimationFrame.
 * Uses delta-time accumulation for consistent step rate regardless of refresh rate.
 */
export function usePlayback(algoId: string | null) {
  const accumulatedRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number>(0);

  const isPlaying = useStore((s) => s.isPlaying);
  const playbackSpeed = useStore((s) => s.playbackSpeed);
  const playbackStep = useStore((s) => algoId ? (s.playbackStep[algoId] ?? 0) : 0);
  const result = useStore((s) => algoId ? s.algorithmResults[algoId] : undefined);

  const totalSteps = result ? result.steps.length : 0;
  const currentStep = playbackStep;

  const play = useCallback(() => {
    useStore.getState().setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    useStore.getState().setIsPlaying(false);
  }, []);

  const stepForward = useCallback(() => {
    if (!algoId || !result) return;
    const current = useStore.getState().playbackStep[algoId] ?? 0;
    if (current < result.steps.length - 1) {
      useStore.getState().setPlaybackStep(algoId, current + 1);
    }
  }, [algoId, result]);

  const stepBackward = useCallback(() => {
    if (!algoId) return;
    const current = useStore.getState().playbackStep[algoId] ?? 0;
    if (current > 0) {
      useStore.getState().setPlaybackStep(algoId, current - 1);
    }
  }, [algoId]);

  const reset = useCallback(() => {
    if (!algoId) return;
    useStore.getState().setPlaybackStep(algoId, 0);
    useStore.getState().setIsPlaying(false);
  }, [algoId]);

  useEffect(() => {
    if (!isPlaying || !algoId || !result) return;

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

      const speed = useStore.getState().playbackSpeed;
      let step = useStore.getState().playbackStep[algoId] ?? 0;
      const maxStep = result.steps.length - 1;

      while (accumulatedRef.current >= speed && step < maxStep) {
        accumulatedRef.current -= speed;
        step += 1;
      }

      const prevStep = useStore.getState().playbackStep[algoId] ?? 0;
      if (step !== prevStep) {
        useStore.getState().setPlaybackStep(algoId, step);
      }

      if (step >= maxStep) {
        useStore.getState().setIsPlaying(false);
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
  }, [isPlaying, algoId, result]);

  return {
    currentStep,
    totalSteps,
    isPlaying,
    play,
    pause,
    stepForward,
    stepBackward,
    reset,
  };
}
