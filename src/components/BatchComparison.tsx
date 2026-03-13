'use client';

import { useState, useCallback } from 'react';
import { useStore } from '../store';
import { ALGORITHM_REGISTRY } from '../algorithms/registry';
import { runAlgorithm } from '../algorithms/runner';
import { generateCities } from '../lib/city-generator';
import { computeHeightField } from '../lib/surface';
import { DEFAULT_SURFACE_PARAMS } from '../lib/types';

interface AlgoStats {
  algoId: string;
  avgTourLength: number;
  bestTourLength: number;
  worstTourLength: number;
  avgComputeTime: number;
  winCount: number;
  winRate: number;
}

export default function BatchComparison() {
  const [seedCount, setSeedCount] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [progressSeed, setProgressSeed] = useState(0);
  const [results, setResults] = useState<AlgoStats[] | null>(null);
  const [testedCityCount, setTestedCityCount] = useState(0);

  const handleRunBatch = useCallback(() => {
    const { cityCount } = useStore.getState();
    setIsRunning(true);
    setProgressSeed(0);
    setResults(null);
    setTestedCityCount(cityCount);

    const algos = ALGORITHM_REGISTRY;
    const totalSeeds = seedCount;

    // Accumulate per-algorithm results across seeds
    const tourLengths: Record<string, number[]> = {};
    const computeTimes: Record<string, number[]> = {};
    const winCounts: Record<string, number> = {};

    for (const algo of algos) {
      tourLengths[algo.id] = [];
      computeTimes[algo.id] = [];
      winCounts[algo.id] = 0;
    }

    let currentSeed = 1;

    const runNextSeed = () => {
      if (currentSeed > totalSeeds) {
        // Compute aggregate stats
        const stats: AlgoStats[] = algos.map((algo) => {
          const lengths = tourLengths[algo.id];
          const times = computeTimes[algo.id];
          const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
          const best = Math.min(...lengths);
          const worst = Math.max(...lengths);
          const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

          return {
            algoId: algo.id,
            avgTourLength: avg,
            bestTourLength: best,
            worstTourLength: worst,
            avgComputeTime: avgTime,
            winCount: winCounts[algo.id],
            winRate: (winCounts[algo.id] / totalSeeds) * 100,
          };
        });

        // Sort by avg tour length ascending
        stats.sort((a, b) => a.avgTourLength - b.avgTourLength);

        setResults(stats);
        setIsRunning(false);
        return;
      }

      // Generate cities and surface for this seed (does NOT mutate the store)
      const cities = generateCities('random', currentSeed, cityCount);
      const surfaceData = computeHeightField(cities, DEFAULT_SURFACE_PARAMS);

      // Run each algorithm for this seed
      let bestLength = Infinity;
      let bestAlgoId = '';

      for (const algo of algos) {
        try {
          const result = runAlgorithm(algo.id, cities, surfaceData);
          tourLengths[algo.id].push(result.tourLength);
          computeTimes[algo.id].push(result.computeTimeMs);

          if (result.tourLength < bestLength) {
            bestLength = result.tourLength;
            bestAlgoId = algo.id;
          }
        } catch (err) {
          console.error(`Batch: algorithm ${algo.id} failed on seed ${currentSeed}:`, err);
          tourLengths[algo.id].push(Infinity);
          computeTimes[algo.id].push(0);
        }
      }

      // Record win
      winCounts[bestAlgoId]++;

      setProgressSeed(currentSeed);
      currentSeed++;

      // Yield to event loop to avoid UI freeze
      setTimeout(runNextSeed, 0);
    };

    setTimeout(runNextSeed, 0);
  }, [seedCount]);

  // Find best values for highlighting
  const bestAvg = results ? Math.min(...results.map((r) => r.avgTourLength)) : 0;
  const bestBest = results ? Math.min(...results.map((r) => r.bestTourLength)) : 0;
  const bestWorst = results ? Math.min(...results.map((r) => r.worstTourLength)) : 0;
  const bestTime = results ? Math.min(...results.map((r) => r.avgComputeTime)) : 0;
  const bestWinRate = results ? Math.max(...results.map((r) => r.winRate)) : 0;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-gray-400 flex items-center gap-2">
          Seeds:
          <input
            type="number"
            min={5}
            max={50}
            value={seedCount}
            onChange={(e) => setSeedCount(Math.max(5, Math.min(50, Number(e.target.value))))}
            disabled={isRunning}
            className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </label>
        <button
          onClick={handleRunBatch}
          disabled={isRunning}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            isRunning
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {isRunning ? `Running seed ${progressSeed}/${seedCount}...` : 'Run Batch'}
        </button>
      </div>

      {/* Results table */}
      {results && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="py-2 px-2 w-10">#</th>
                  <th className="py-2 px-2">Algorithm</th>
                  <th className="py-2 px-2 text-right">Avg Tour Length</th>
                  <th className="py-2 px-2 text-right">Best</th>
                  <th className="py-2 px-2 text-right">Worst</th>
                  <th className="py-2 px-2 text-right">Avg Time (ms)</th>
                  <th className="py-2 px-2 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, index) => {
                  const algo = ALGORITHM_REGISTRY.find((a) => a.id === row.algoId);
                  const color = algo?.color ?? '#fff';
                  const name = algo?.name ?? row.algoId;

                  return (
                    <tr
                      key={row.algoId}
                      className={`border-b border-gray-800 ${
                        index === 0 ? 'bg-yellow-900/20' : index % 2 === 1 ? 'bg-gray-800/30' : ''
                      }`}
                    >
                      <td className="py-1.5 px-2 text-gray-500">{index + 1}</td>
                      <td className="py-1.5 px-2">
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          {name}
                        </span>
                      </td>
                      <td className={`py-1.5 px-2 text-right font-mono ${
                        row.avgTourLength === bestAvg ? 'text-green-400' : ''
                      }`}>
                        {row.avgTourLength.toFixed(4)}
                      </td>
                      <td className={`py-1.5 px-2 text-right font-mono ${
                        row.bestTourLength === bestBest ? 'text-green-400' : ''
                      }`}>
                        {row.bestTourLength.toFixed(4)}
                      </td>
                      <td className={`py-1.5 px-2 text-right font-mono ${
                        row.worstTourLength === bestWorst ? 'text-green-400' : ''
                      }`}>
                        {row.worstTourLength.toFixed(4)}
                      </td>
                      <td className={`py-1.5 px-2 text-right font-mono ${
                        row.avgComputeTime === bestTime ? 'text-green-400' : ''
                      }`}>
                        {row.avgComputeTime.toFixed(1)}
                      </td>
                      <td className={`py-1.5 px-2 text-right font-mono ${
                        row.winRate === bestWinRate ? 'text-green-400' : ''
                      }`}>
                        {Math.round(row.winRate)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            Tested on {seedCount} random instances with {testedCityCount} cities each
          </p>
        </>
      )}

      {!results && !isRunning && (
        <div className="text-sm text-gray-500 text-center py-4">
          Run a batch to compare algorithms across multiple random instances
        </div>
      )}
    </div>
  );
}
