import type { City } from '@/lib/types';
import type { AlgoStep } from './types';
import { tourLength, tourEdges } from './tour-utils';

/** Genetic Algorithm metaheuristic for TSP */
export function solveGeneticAlgorithm(cities: City[]): AlgoStep[] {
  const n = cities.length;
  if (n === 0) return [];
  if (n <= 2) {
    const tour = Array.from({ length: n }, (_, i) => i);
    return [{ tour, edges: tourEdges(tour), cost: tourLength(cities, tour), description: 'GA: trivial tour' }];
  }

  const steps: AlgoStep[] = [];
  const popSize = 50;
  const generations = 100;
  const tournamentSize = 3;
  const mutationRate = 0.1;

  // Initialize population with random permutations
  let population: number[][] = [];
  for (let p = 0; p < popSize; p++) {
    const individual = Array.from({ length: n }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = individual[i];
      individual[i] = individual[j];
      individual[j] = tmp;
    }
    population.push(individual);
  }

  let bestTour = population[0];
  let bestCost = tourLength(cities, bestTour);

  // Evaluate initial population
  for (const ind of population) {
    const c = tourLength(cities, ind);
    if (c < bestCost) {
      bestCost = c;
      bestTour = [...ind];
    }
  }

  steps.push({
    tour: [...bestTour],
    edges: tourEdges(bestTour),
    cost: bestCost,
    description: `GA: initial population, best=${bestCost.toFixed(3)}`,
  });

  for (let gen = 0; gen < generations; gen++) {
    const newPop: number[][] = [];

    for (let p = 0; p < popSize; p++) {
      // Tournament selection for two parents
      const parent1 = tournamentSelect(population, cities, tournamentSize);
      const parent2 = tournamentSelect(population, cities, tournamentSize);

      // Order crossover (OX1)
      let child = orderCrossover(parent1, parent2, n);

      // Swap mutation
      if (Math.random() < mutationRate) {
        const i = Math.floor(Math.random() * n);
        const j = Math.floor(Math.random() * n);
        const tmp = child[i];
        child[i] = child[j];
        child[j] = tmp;
      }

      newPop.push(child);

      const c = tourLength(cities, child);
      if (c < bestCost) {
        bestCost = c;
        bestTour = [...child];
      }
    }

    population = newPop;

    // Calculate average cost
    let totalCost = 0;
    for (const ind of population) {
      totalCost += tourLength(cities, ind);
    }
    const avgCost = totalCost / popSize;

    steps.push({
      tour: [...bestTour],
      edges: tourEdges(bestTour),
      cost: bestCost,
      description: `GA: Gen ${gen + 1}, best=${bestCost.toFixed(3)}, avg=${avgCost.toFixed(3)}`,
    });
  }

  return steps;
}

function tournamentSelect(population: number[][], cities: City[], size: number): number[] {
  let best: number[] | null = null;
  let bestCost = Infinity;

  for (let i = 0; i < size; i++) {
    const idx = Math.floor(Math.random() * population.length);
    const cost = tourLength(cities, population[idx]);
    if (cost < bestCost) {
      bestCost = cost;
      best = population[idx];
    }
  }

  return best!;
}

function orderCrossover(parent1: number[], parent2: number[], n: number): number[] {
  let start = Math.floor(Math.random() * n);
  let end = Math.floor(Math.random() * n);
  if (start > end) { const t = start; start = end; end = t; }

  const child = new Array<number>(n).fill(-1);

  // Copy segment from parent1
  for (let i = start; i <= end; i++) {
    child[i] = parent1[i];
  }

  // Fill remaining from parent2 in order
  const used = new Set(child.filter(v => v !== -1));
  let pos = (end + 1) % n;
  for (let i = 0; i < n; i++) {
    const gene = parent2[(end + 1 + i) % n];
    if (!used.has(gene)) {
      child[pos] = gene;
      pos = (pos + 1) % n;
    }
  }

  return child;
}
