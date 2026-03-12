import { StateCreator } from 'zustand';
import { SurfaceData, SurfaceParams, DEFAULT_SURFACE_PARAMS } from '../lib/types';
import { computeHeightField } from '../lib/surface';
import type { StoreState } from './index';

export interface SurfaceSlice {
  surfaceData: SurfaceData | null;
  surfaceParams: SurfaceParams;
  recomputeSurface: () => void;
  setSurfaceParams: (params: Partial<SurfaceParams>) => void;
}

export const createSurfaceSlice: StateCreator<StoreState, [], [], SurfaceSlice> = (set, get) => ({
  surfaceData: null,
  surfaceParams: DEFAULT_SURFACE_PARAMS,
  recomputeSurface: () => {
    const { cities, surfaceParams } = get();
    const surfaceData = computeHeightField(cities, surfaceParams);
    set({ surfaceData });
  },
  setSurfaceParams: (params) => {
    set((state) => ({
      surfaceParams: { ...state.surfaceParams, ...params },
    }));
    get().recomputeSurface();
  },
});
