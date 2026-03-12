import { StateCreator } from 'zustand';
import { City, PresetName, DEFAULT_SEED, DEFAULT_CITY_COUNT } from '../lib/types';
import { generateCities } from '../lib/city-generator';
import type { StoreState } from './index';

export interface CitySlice {
  cities: City[];
  preset: PresetName;
  seed: number;
  cityCount: number;
  setCities: (preset: PresetName, seed: number, count?: number) => void;
}

export const createCitySlice: StateCreator<StoreState, [], [], CitySlice> = (set, get) => ({
  cities: [],
  preset: 'random',
  seed: DEFAULT_SEED,
  cityCount: DEFAULT_CITY_COUNT,
  setCities: (preset, seed, count) => {
    const cityCount = count ?? get().cityCount;
    const cities = generateCities(preset, seed, cityCount);
    set({ cities, preset, seed, cityCount });
    // Trigger surface recomputation after cities change
    get().recomputeSurface();
  },
});
