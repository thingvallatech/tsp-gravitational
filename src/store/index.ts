import { create } from 'zustand';
import { CitySlice, createCitySlice } from './city-slice';
import { SurfaceSlice, createSurfaceSlice } from './surface-slice';
import { AlgorithmSlice, createAlgorithmSlice } from './algorithm-slice';

export type StoreState = CitySlice & SurfaceSlice & AlgorithmSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createCitySlice(...a),
  ...createSurfaceSlice(...a),
  ...createAlgorithmSlice(...a),
}));
