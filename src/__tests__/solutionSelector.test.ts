import { describe, it, expect } from 'vitest';
import { ergoScore, selectForFace, selectAllFaces } from '../cube/solutionSelector';
import type { CrossSolution } from '../cube/crossSolver';
import type { Move } from '../types';

describe('ergoScore', () => {
  it('scores U R L moves at 1.0 each', () => {
    expect(ergoScore(['U', 'R', 'L'] as Move[])).toBe(3.0);
  });

  it('scores D moves at 1.2', () => {
    expect(ergoScore(['D', "D'", 'D2'] as Move[])).toBeCloseTo(3.6);
  });

  it('scores F/B at 1.5, F2/B2 at 2.5', () => {
    expect(ergoScore(['F'] as Move[])).toBe(1.5);
    expect(ergoScore(['F2'] as Move[])).toBe(2.5);
    expect(ergoScore(['B2'] as Move[])).toBe(2.5);
  });

  it('scores y moves at 1.5', () => {
    expect(ergoScore(['y'] as Move[])).toBe(1.5);
  });
});

describe('selectForFace', () => {
  it('returns empty for no solutions', () => {
    expect(selectForFace([])).toEqual([]);
  });

  it('always picks 2 最短 and 2 最良', () => {
    const solutions: CrossSolution[] = [
      { moves: ['R'] as Move[], frontFace: 'B' },
      { moves: ['R', 'U'] as Move[], frontFace: 'B' },
      { moves: ['R', 'U', 'L'] as Move[], frontFace: 'B' },
      { moves: ['R', 'U', 'L', 'D'] as Move[], frontFace: 'B' },
    ];

    const result = selectForFace(solutions);
    const shortest = result.filter((r) => r.category === '最短');
    const best = result.filter((r) => r.category === '最良');
    expect(shortest).toHaveLength(2);
    expect(best).toHaveLength(2);
  });

  it('does not add clean shortest when one shortest is B/y-free', () => {
    const solutions: CrossSolution[] = [
      { moves: ['R'] as Move[], frontFace: 'B' }, // no B/y
      { moves: ['B', 'R'] as Move[], frontFace: 'B' }, // has B
      { moves: ['R', 'U', 'L'] as Move[], frontFace: 'B' },
    ];

    const result = selectForFace(solutions);
    // Only 2 最短 + 2 最良 = 4
    expect(result).toHaveLength(4);
  });

  it('adds clean shortest when both shortest have B or y', () => {
    const solutions: CrossSolution[] = [
      { moves: ['B'] as Move[], frontFace: 'B' },
      { moves: ["B'"] as Move[], frontFace: 'B' },
      { moves: ['R', 'U', 'L'] as Move[], frontFace: 'B' },
    ];
    const cleanSolutions: CrossSolution[] = [
      { moves: ['R', 'U'] as Move[], frontFace: 'B', clean: true },
    ];

    const result = selectForFace([...solutions, ...cleanSolutions]);
    const shortest = result.filter((r) => r.category === '最短');
    expect(shortest).toHaveLength(3); // 2 normal + 1 clean
    // The clean one should be B/y-free
    expect(shortest[2]!.hasB).toBe(false);
    expect(shortest[2]!.hasY).toBe(false);
  });

  it('adds clean best when both best have B or y', () => {
    // Best by ergo: y R (1.5+1.0=2.5), B R (1.5+1.0=2.5) → both have B/y
    const solutions: CrossSolution[] = [
      { moves: ['y', 'R'] as Move[], frontFace: 'B' },
      { moves: ['B', 'R'] as Move[], frontFace: 'B' },
      { moves: ['R', 'U', 'L', 'D', 'F'] as Move[], frontFace: 'B' }, // worse ergo
    ];
    const cleanSolutions: CrossSolution[] = [
      { moves: ['R', 'U', 'L'] as Move[], frontFace: 'B', clean: true },
    ];

    const result = selectForFace([...solutions, ...cleanSolutions]);
    const best = result.filter((r) => r.category === '最良');
    expect(best).toHaveLength(3); // 2 normal + 1 clean
    expect(best[2]!.hasB).toBe(false);
    expect(best[2]!.hasY).toBe(false);
  });

  it('does not add clean when no clean solutions available', () => {
    const solutions: CrossSolution[] = [
      { moves: ['B'] as Move[], frontFace: 'B' },
      { moves: ["B'"] as Move[], frontFace: 'B' },
    ];
    // No clean solutions

    const result = selectForFace(solutions);
    const shortest = result.filter((r) => r.category === '最短');
    expect(shortest).toHaveLength(2); // just normal, no clean
  });

  it('result has correct hasB and hasY flags', () => {
    const solutions: CrossSolution[] = [
      { moves: ['B', 'y', 'R'] as Move[], frontFace: 'B' },
      { moves: ['R', 'U'] as Move[], frontFace: 'B' },
    ];

    const result = selectForFace(solutions);
    const withB = result.find((r) => r.moves.join(' ') === 'B y R');
    const without = result.find((r) => r.moves.join(' ') === 'R U');
    expect(withB?.hasB).toBe(true);
    expect(withB?.hasY).toBe(true);
    expect(without?.hasB).toBe(false);
    expect(without?.hasY).toBe(false);
  });
});

describe('selectAllFaces', () => {
  it('groups by frontFace', () => {
    const solutions: CrossSolution[] = [
      { moves: ['R'] as Move[], frontFace: 'B' },
      { moves: ['L'] as Move[], frontFace: 'R' },
      { moves: ['U'] as Move[], frontFace: 'B' },
    ];

    const result = selectAllFaces(solutions);
    expect(Object.keys(result)).toContain('B');
    expect(Object.keys(result)).toContain('R');
  });
});
