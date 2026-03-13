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
      <div className="text-sm text-slate-500 text-center py-6">
        Run algorithms to see rankings
      </div>
    );
  }

  const bestTourLength = entries[0].tourLength;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 text-xs uppercase tracking-wider">
            <th className="py-2 px-2 w-8">#</th>
            <th className="py-2 px-2">Algorithm</th>
            <th className="py-2 px-2 text-right">Tour</th>
            <th className="py-2 px-2 text-right">Time</th>
            <th className="py-2 px-2 text-right">Gap</th>
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
                className={`border-t border-slate-700/50 ${
                  isFirst ? 'bg-amber-500/5' : ''
                }`}
              >
                <td className="py-2 px-2">
                  <span className={`text-xs font-medium ${isFirst ? 'text-amber-400' : 'text-slate-500'}`}>
                    {index + 1}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-slate-200">{name}</span>
                  </span>
                </td>
                <td className="py-2 px-2 text-right font-mono text-slate-300 text-xs">
                  {result.tourLength.toFixed(3)}
                </td>
                <td className="py-2 px-2 text-right font-mono text-slate-400 text-xs">
                  {result.computeTimeMs.toFixed(1)}ms
                </td>
                <td className="py-2 px-2 text-right font-mono text-xs">
                  {isFirst ? (
                    <span className="text-emerald-400">best</span>
                  ) : (
                    <span className="text-slate-400">+{gap}%</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
