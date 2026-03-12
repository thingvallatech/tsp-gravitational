'use client';

import { useState, useCallback } from 'react';
import { useStore } from '../store';
import { ALGORITHM_REGISTRY } from '../algorithms/registry';
import { runAlgorithm } from '../algorithms/runner';
import { generateCities } from '../lib/city-generator';
import { computeHeightField } from '../lib/surface';
import { DEFAULT_SURFACE_PARAMS } from '../lib/types';

interface BatchResult {
  algoId: string;
  tourLengths: number[];
  computeTimes: number[];
}

export default function BatchComparison() {
  return (
    <div className="text-sm text-gray-500 text-center py-4">
      Batch comparison coming soon
    </div>
  );
}
