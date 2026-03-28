import { describe, it, expect } from 'vitest';
import { solveCross } from '../cube/crossSolver';
import { solvedState } from '../cube/pieces';
import { applyMoves } from '../cube/moves';
import type { Move } from '../types';

// Helper: check if white cross is solved (edges 0-3 at positions 0-3 with orientation 0)
function isCrossSolved(state: ReturnType<typeof solvedState>): boolean {
  return (
    state.ep[0] === 0 &&
    state.eo[0] === 0 &&
    state.ep[1] === 1 &&
    state.eo[1] === 0 &&
    state.ep[2] === 2 &&
    state.eo[2] === 0 &&
    state.ep[3] === 3 &&
    state.eo[3] === 0
  );
}

describe('crossSolver', () => {
  it('returns empty solution for already-solved cross', () => {
    const solutions = solveCross(solvedState());
    expect(solutions).toHaveLength(1);
    expect(solutions[0]).toEqual([]);
  });

  it('solves cross after a single move', () => {
    const scrambled = applyMoves(solvedState(), ['R']);
    const solutions = solveCross(scrambled, 3);
    expect(solutions.length).toBeGreaterThan(0);

    // Verify the first solution actually solves the cross
    const result = applyMoves(scrambled, solutions[0]!);
    expect(isCrossSolved(result)).toBe(true);
  });

  it('solves cross after 2 moves', () => {
    const scrambled = applyMoves(solvedState(), ['R', 'U']);
    const solutions = solveCross(scrambled, 3);
    expect(solutions.length).toBeGreaterThan(0);

    for (const sol of solutions) {
      const result = applyMoves(scrambled, sol);
      expect(isCrossSolved(result)).toBe(true);
    }
  });

  it('solves cross after 3 moves', () => {
    const scrambled = applyMoves(solvedState(), ['R', 'U', "F'"]);
    const solutions = solveCross(scrambled, 3);
    expect(solutions.length).toBeGreaterThan(0);

    for (const sol of solutions) {
      const result = applyMoves(scrambled, sol);
      expect(isCrossSolved(result)).toBe(true);
    }
  });

  it('solves cross after a short scramble', () => {
    const scramble: Move[] = ['F', "R'", 'U', 'D2'];
    const scrambled = applyMoves(solvedState(), scramble);
    const solutions = solveCross(scrambled, 3);
    expect(solutions.length).toBeGreaterThan(0);

    for (const sol of solutions) {
      const result = applyMoves(scrambled, sol);
      expect(isCrossSolved(result)).toBe(true);
    }
  });

  it('returns multiple distinct solutions when available', () => {
    const scrambled = applyMoves(solvedState(), ['R', 'U']);
    const solutions = solveCross(scrambled, 5);

    if (solutions.length > 1) {
      const strings = solutions.map((s) => s.join(' '));
      const unique = new Set(strings);
      expect(unique.size).toBe(strings.length);
    }
  });

  it('solution length is optimal or near-optimal', () => {
    // After single R, cross can be solved in 1 move (R')
    const scrambled = applyMoves(solvedState(), ['R']);
    const solutions = solveCross(scrambled, 3);
    expect(solutions[0]!.length).toBeLessThanOrEqual(1);
  });
});
