import type { City } from '@/lib/types';
import type { AlgoStep } from './types';
import { euclideanDistance } from '@/lib/math-utils';
import { tourLength, tourEdges } from './tour-utils';

/** Ant Colony Optimization metaheuristic */
export function solveAntColony(cities: City[]): AlgoStep[] {
  const n = cities.length;
  if (n === 0) return [];
  if (n <= 2) {
    const tour = Array.from({ length: n }, (_, i) => i);
    return [{ tour, edges: tourEdges(tour), cost: tourLength(cities, tour), description: 'ACO: trivial tour' }];
  }

  const steps: AlgoStep[] = [];
  const numAnts = 20;
  const iterations = 50;
  const alpha = 1;    // pheromone importance
  const beta = 2;     // distance importance
  const evaporation = 0.5;
  const Q = 1;

  // Distance matrix
  const dist: number[][] = Array.from({ length: n }, () => new Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      dist[i][j] = i === j ? 0 : euclideanDistance(cities[i].x, cities[i].y, cities[j].x, cities[j].y);
    }
  }

  // Pheromone matrix (initialized to small constant)
  const tau: number[][] = Array.from({ length: n }, () => new Array(n).fill(1));

  // Heuristic matrix (1/distance)
  const eta: number[][] = Array.from({ length: n }, () => new Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      eta[i][j] = dist[i][j] > 0 ? 1 / dist[i][j] : 0;
    }
  }

  let bestTour: number[] = Array.from({ length: n }, (_, i) => i);
  let bestCost = tourLength(cities, bestTour);

  for (let iter = 0; iter < iterations; iter++) {
    const antTours: number[][] = [];

    for (let ant = 0; ant < numAnts; ant++) {
      const tour = buildAntTour(n, tau, eta, alpha, beta);
      antTours.push(tour);

      const cost = tourLength(cities, tour);
      if (cost < bestCost) {
        bestCost = cost;
        bestTour = [...tour];
      }
    }

    // Evaporate pheromones
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        tau[i][j] *= (1 - evaporation);
      }
    }

    // Deposit pheromones
    for (const tour of antTours) {
      const cost = tourLength(cities, tour);
      const deposit = Q / cost;
      for (let k = 0; k < n; k++) {
        const a = tour[k];
        const b = tour[(k + 1) % n];
        tau[a][b] += deposit;
        tau[b][a] += deposit;
      }
    }

    steps.push({
      tour: [...bestTour],
      edges: tourEdges(bestTour),
      cost: bestCost,
      description: `ACO: Iteration ${iter + 1}, best ant tour=${bestCost.toFixed(3)}`,
    });
  }

  return steps;
}

function buildAntTour(n: number, tau: number[][], eta: number[][], alpha: number, beta: number): number[] {
  const visited = new Uint8Array(n);
  const start = Math.floor(Math.random() * n);
  const tour: number[] = [start];
  visited[start] = 1;

  for (let step = 1; step < n; step++) {
    const current = tour[tour.length - 1];

    // Calculate probabilities for unvisited cities
    let total = 0;
    const probs: number[] = new Array(n);
    for (let j = 0; j < n; j++) {
      if (visited[j]) {
        probs[j] = 0;
      } else {
        probs[j] = Math.pow(tau[current][j], alpha) * Math.pow(eta[current][j], beta);
        total += probs[j];
      }
    }

    // Roulette wheel selection
    let r = Math.random() * total;
    let selected = -1;
    for (let j = 0; j < n; j++) {
      if (visited[j]) continue;
      r -= probs[j];
      if (r <= 0) {
        selected = j;
        break;
      }
    }
    // Fallback: pick first unvisited
    if (selected === -1) {
      for (let j = 0; j < n; j++) {
        if (!visited[j]) { selected = j; break; }
      }
    }

    tour.push(selected);
    visited[selected] = 1;
  }

  return tour;
}
