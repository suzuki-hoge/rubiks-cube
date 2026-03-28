import { useMemo } from 'react';
import type { CubeState, Move } from '../types';
import { solveCross } from '../cube/crossSolver';

export function useCrossSolver(scrambledState: CubeState, scramble: Move[]) {
  const solutions = useMemo(() => {
    if (scramble.length === 0) return [];
    return solveCross(scrambledState, 5);
  }, [scrambledState, scramble]);

  return solutions;
}
