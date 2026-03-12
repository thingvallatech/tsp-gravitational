import type { City, SurfaceData } from '@/lib/types';

/** A single step in the algorithm's execution for animation playback */
export interface AlgoStep {
  tour: number[];           // city indices in visit order (partial or complete)
  edges: [number, number][]; // edges being considered/added this step
  cost: number;             // current tour length
  description: string;      // human-readable narration of this step
}

/** Category of TSP algorithm */
export type AlgorithmCategory = 'construction' | 'improvement' | 'metaheuristic' | 'novel';

/** Result returned after running an algorithm */
export interface AlgoResult {
  algoId: string;
  steps: AlgoStep[];
  finalTour: number[];
  tourLength: number;
  computeTimeMs: number;
}

/** A registered TSP algorithm */
export interface TSPAlgorithm {
  id: string;
  name: string;
  category: AlgorithmCategory;
  color: string;
  description: string;
  solve: (cities: City[], surfaceData?: SurfaceData) => AlgoStep[];
  requiresSurface?: boolean;
}
