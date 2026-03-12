'use client';

import { useStore } from '../store';
import { ALGORITHM_REGISTRY } from '../algorithms/registry';

export default function Leaderboard() {
  const algorithmResults = useStore((s) => s.algorithmResults);

  const entries = Object.values(algorithmResults)
    .filter((r) => r.tourLength > 0)
    .sort((a, b) => a.tourLength - b.tourLength);

  if (entries.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        Run algorithms to see rankings
      </div>
    );
  }

  const bestTourLength = entries[0].tourLength;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-700">
            <th className="py-2 px-2 w-10">#</th>
            <th className="py-2 px-2">Algorithm</th>
            <th className="py-2 px-2 text-right">Tour Length</th>
            <th className="py-2 px-2 text-right">Time (ms)</th>
            <th className="py-2 px-2 text-right">Gap (%)</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((result, index) => {
            const algo = ALGORITHM_REGISTRY.find((a) => a.id === result.algoId);
            const color = algo?.color ?? '#fff';
            const name = algo?.name ?? result.algoId;
            const gap = ((result.tourLength - bestTourLength) / bestTourLength * 100).toFixed(1);
            const isFirst = index === 0;

            return (
              <tr
                key={result.algoId}
                className={`border-b border-gray-800 ${
                  isFirst ? 'bg-yellow-900/20' : index % 2 === 1 ? 'bg-gray-800/30' : ''
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
                <td className="py-1.5 px-2 text-right font-mono">{result.tourLength.toFixed(4)}</td>
                <td className="py-1.5 px-2 text-right font-mono">{result.computeTimeMs.toFixed(1)}</td>
                <td className="py-1.5 px-2 text-right font-mono">
                  {isFirst ? '--' : `+${gap}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
