import { StateCreator } from 'zustand';
import type { AlgoResult } from '@/algorithms/types';
import type { StoreState } from './index';

export interface AlgorithmSlice {
  algorithmResults: Record<string, AlgoResult>;
  playbackStep: Record<string, number>;
  playbackSpeed: number;
  isPlaying: boolean;
  selectedAlgoId: string | null;
  setAlgorithmResult: (algoId: string, result: AlgoResult) => void;
  clearAlgorithmResults: () => void;
  setPlaybackStep: (algoId: string, step: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setSelectedAlgoId: (algoId: string | null) => void;
}

export const createAlgorithmSlice: StateCreator<StoreState, [], [], AlgorithmSlice> = (set) => ({
  algorithmResults: {},
  playbackStep: {},
  playbackSpeed: 300,
  isPlaying: false,
  selectedAlgoId: null,
  setAlgorithmResult: (algoId, result) =>
    set((state) => ({
      algorithmResults: { ...state.algorithmResults, [algoId]: result },
    })),
  clearAlgorithmResults: () =>
    set({ algorithmResults: {}, playbackStep: {} }),
  setPlaybackStep: (algoId, step) =>
    set((state) => ({
      playbackStep: { ...state.playbackStep, [algoId]: step },
    })),
  setPlaybackSpeed: (speed) =>
    set({ playbackSpeed: speed }),
  setIsPlaying: (playing) =>
    set({ isPlaying: playing }),
  setSelectedAlgoId: (algoId) =>
    set({ selectedAlgoId: algoId }),
});
