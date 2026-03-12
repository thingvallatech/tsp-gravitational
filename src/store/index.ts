import { create } from 'zustand';
import { CitySlice, createCitySlice } from './city-slice';
import { SurfaceSlice, createSurfaceSlice } from './surface-slice';

export type StoreState = CitySlice & SurfaceSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createCitySlice(...a),
  ...createSurfaceSlice(...a),
}));
