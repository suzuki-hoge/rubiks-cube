import type { Move } from '../types';
import type { CrossSolution } from './crossSolver';

export type Category = '最短' | '最良';

export interface RankedSolution {
  moves: Move[];
  category: Category;
  hasB: boolean;
  hasY: boolean;
  moveCount: number;
  score: number; // ergoScore
}

const ERGO_WEIGHTS: Record<string, number> = {
  U: 1.0,
  "U'": 1.0,
  U2: 1.0,
  R: 1.0,
  "R'": 1.0,
  R2: 1.0,
  L: 1.0,
  "L'": 1.0,
  L2: 1.0,
  D: 1.2,
  "D'": 1.2,
  D2: 1.2,
  F: 1.5,
  "F'": 1.5,
  F2: 2.5,
  B: 1.5,
  "B'": 1.5,
  B2: 2.5,
  y: 1.5,
  "y'": 1.5,
  y2: 1.5,
};

export function ergoScore(moves: Move[]): number {
  let score = 0;
  for (const m of moves) {
    score += ERGO_WEIGHTS[m] ?? 1.0;
  }
  // Round to 1 decimal
  return Math.round(score * 10) / 10;
}

function hasB(moves: Move[]): boolean {
  return moves.some((m) => m[0] === 'B');
}

function hasY(moves: Move[]): boolean {
  return moves.some((m) => m[0] === 'y');
}

function sortByMoveThenErgo(a: CrossSolution, b: CrossSolution): number {
  const diff = a.moves.length - b.moves.length;
  if (diff !== 0) return diff;
  return ergoScore(a.moves) - ergoScore(b.moves);
}

function sortByErgoThenMove(a: CrossSolution, b: CrossSolution): number {
  const diff = ergoScore(a.moves) - ergoScore(b.moves);
  if (diff !== 0) return diff;
  return a.moves.length - b.moves.length;
}

function pickTop(
  solutions: CrossSolution[],
  sort: (a: CrossSolution, b: CrossSolution) => number,
  count: number,
): CrossSolution[] {
  const sorted = [...solutions].sort(sort);
  const result: CrossSolution[] = [];
  const seen = new Set<string>();
  for (const sol of sorted) {
    if (result.length >= count) break;
    const key = sol.moves.join(' ');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(sol);
  }
  return result;
}

function toRanked(sol: CrossSolution, category: Category): RankedSolution {
  return {
    moves: sol.moves,
    category,
    hasB: hasB(sol.moves),
    hasY: hasY(sol.moves),
    moveCount: sol.moves.length,
    score: ergoScore(sol.moves),
  };
}

function hasBOrY(moves: Move[]): boolean {
  return hasB(moves) || hasY(moves);
}

export function selectForFace(solutions: CrossSolution[]): RankedSolution[] {
  if (solutions.length === 0) return [];

  const normal = solutions.filter((s) => !s.clean);
  const clean = solutions.filter((s) => s.clean);

  const result: RankedSolution[] = [];

  // 最短: top 2 by move count (from normal solutions)
  const shortest = pickTop(normal, sortByMoveThenErgo, 2);
  for (const s of shortest) result.push(toRanked(s, '最短'));

  // Clean最短: if both shortest have B or y, pick 1 from clean
  if (shortest.length >= 2 && shortest.every((s) => hasBOrY(s.moves))) {
    const pick = pickTop(clean, sortByMoveThenErgo, 1);
    for (const s of pick) result.push(toRanked(s, '最短'));
  }

  // 最良: top 2 by ergo score (from normal solutions)
  const best = pickTop(normal, sortByErgoThenMove, 2);
  for (const s of best) result.push(toRanked(s, '最良'));

  // Clean最良: if both best have B or y, pick 1 from clean
  if (best.length >= 2 && best.every((s) => hasBOrY(s.moves))) {
    const pick = pickTop(clean, sortByErgoThenMove, 1);
    for (const s of pick) result.push(toRanked(s, '最良'));
  }

  return result;
}

export type SolutionsByFace = Record<string, RankedSolution[]>;

export function selectAllFaces(solutions: CrossSolution[]): SolutionsByFace {
  const byFace: Record<string, CrossSolution[]> = {};
  for (const sol of solutions) {
    const face = sol.frontFace;
    if (!byFace[face]) byFace[face] = [];
    byFace[face].push(sol);
  }

  const result: SolutionsByFace = {};
  for (const [face, sols] of Object.entries(byFace)) {
    result[face] = selectForFace(sols);
  }
  return result;
}
