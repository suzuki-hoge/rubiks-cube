import type { CubeState, Move, EdgePiece, FaceColor } from '../types';
import { applyMove, applyMoves } from './moves';
import { cloneState } from './pieces';

// D-cross edges: DR=4, DF=5, DL=6, DB=7
// Target pieces depend on yCount (front face rotation)
// BASE = [0,3,2,1] → targets[i] = (BASE[i] + yCount) % 4
// Maps D-slot index (0=DR,1=DF,2=DL,3=DB) to which piece (0-3) should be there
const BASE_TARGETS = [0, 3, 2, 1];

function getDCrossTargets(yCount: number): EdgePiece[] {
  return BASE_TARGETS.map((b) => ((b + yCount) % 4) as EdgePiece);
}

function isDCrossSolved(state: CubeState, yCount: number): boolean {
  const targets = getDCrossTargets(yCount);
  for (let i = 0; i < 4; i++) {
    const pos = 4 + i; // DR=4, DF=5, DL=6, DB=7
    if (state.ep[pos] !== targets[i]! || state.eo[pos] !== 0) return false;
  }
  return true;
}

function dCrossHeuristic(state: CubeState, yCount: number): number {
  // outsideD: cross pieces not in D layer. Each needs ≥1 non-D face move to enter.
  // flippedInD: cross pieces in D with wrong eo. Each needs ≥1 move to eject.
  // Both are admissible lower bounds (different resources needed).
  const targets = getDCrossTargets(yCount);
  let outsideD = 0;
  let flippedInD = 0;
  let allSolved = true;

  for (let i = 0; i < 4; i++) {
    const targetPos = 4 + i;
    const piece = targets[i]!;
    const pos = state.ep.indexOf(piece);

    if (pos === targetPos && state.eo[pos] === 0) {
      continue;
    }
    allSolved = false;
    if (pos < 4 || pos > 7) {
      outsideD++;
    } else if (state.eo[pos] !== 0) {
      flippedInD++;
    }
  }

  if (allSolved) return 0;
  return Math.max(outsideD + flippedInD, 1); // max value 4
}

const FACE_MOVES: Move[] = [
  'U',
  "U'",
  'U2',
  'D',
  "D'",
  'D2',
  'R',
  "R'",
  'R2',
  'L',
  "L'",
  'L2',
  'F',
  "F'",
  'F2',
  'B',
  "B'",
  'B2',
];

const FACE_MOVES_NO_B: Move[] = [
  'U',
  "U'",
  'U2',
  'D',
  "D'",
  'D2',
  'R',
  "R'",
  'R2',
  'L',
  "L'",
  'L2',
  'F',
  "F'",
  'F2',
];

const Y_MOVES: Move[] = ['y', "y'", 'y2'];

function yMoveCount(move: Move): number {
  switch (move) {
    case 'y':
      return 1;
    case "y'":
      return 3;
    case 'y2':
      return 2;
    default:
      return 0;
  }
}

// Mutable budget object to cap total nodes across recursive calls
interface SearchBudget {
  nodes: number;
  limit: number;
}

function idaDCrossDFS(
  state: CubeState,
  depth: number,
  maxDepth: number,
  lastMove: string | null,
  path: Move[],
  solutions: Move[][],
  maxSolutions: number,
  yCount: number,
  yUsed: boolean,
  budget: SearchBudget,
  faceMoves: Move[] = FACE_MOVES,
): void {
  if (budget.nodes >= budget.limit || solutions.length >= maxSolutions) return;
  budget.nodes++;

  if (isDCrossSolved(state, yCount)) {
    solutions.push([...path]);
    return;
  }

  if (depth >= maxDepth) return;
  if (depth + dCrossHeuristic(state, yCount) > maxDepth) return;

  // Try face moves
  for (const move of faceMoves) {
    const face = move[0]!;
    if (lastMove && lastMove[0] === face) continue;
    if (lastMove) {
      const oppositePairs: Record<string, string> = {
        U: 'D',
        D: 'U',
        R: 'L',
        L: 'R',
        F: 'B',
        B: 'F',
      };
      if (oppositePairs[face] === lastMove[0]) {
        if (face > lastMove[0]!) continue;
      }
    }

    const next = applyMove(state, move);
    path.push(move);
    idaDCrossDFS(
      next,
      depth + 1,
      maxDepth,
      move,
      path,
      solutions,
      maxSolutions,
      yCount,
      yUsed,
      budget,
      faceMoves,
    );
    path.pop();
  }

  // Try y moves (at most once per solution)
  if (!yUsed) {
    for (const move of Y_MOVES) {
      if (lastMove && lastMove[0] === 'y') continue;

      const next = applyMove(state, move);
      const newYCount = (yCount + yMoveCount(move)) % 4;
      path.push(move);
      idaDCrossDFS(
        next,
        depth + 1,
        maxDepth,
        move,
        path,
        solutions,
        maxSolutions,
        newYCount,
        true,
        budget,
        faceMoves,
      );
      path.pop();
    }
  }
}

// Per-face node budget: ~2s at ~1μs/node
const NODE_BUDGET = 2_000_000;

function solveDCross(state: CubeState, yCount: number, maxSolutions = 20): Move[][] {
  if (isDCrossSolved(state, yCount)) return [[]];

  const solutions: Move[][] = [];
  const budget: SearchBudget = { nodes: 0, limit: NODE_BUDGET };

  for (let maxDepth = 1; maxDepth <= 8; maxDepth++) {
    idaDCrossDFS(
      cloneState(state),
      0,
      maxDepth,
      null,
      [],
      solutions,
      maxSolutions,
      yCount,
      false,
      budget,
    );
    if (solutions.length > 0 || budget.nodes >= budget.limit) break;
  }

  // Deduplicate
  const seen = new Set<string>();
  return solutions.filter((sol) => {
    const key = sol.join(' ');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const CLEAN_NODE_BUDGET = 500_000;

function solveDCrossClean(state: CubeState, yCount: number, maxSolutions = 5): Move[][] {
  if (isDCrossSolved(state, yCount)) return [[]];

  const solutions: Move[][] = [];
  const budget: SearchBudget = { nodes: 0, limit: CLEAN_NODE_BUDGET };

  for (let maxDepth = 1; maxDepth <= 7; maxDepth++) {
    idaDCrossDFS(
      cloneState(state),
      0,
      maxDepth,
      null,
      [],
      solutions,
      maxSolutions,
      yCount,
      true, // yUsed=true → prevents y moves
      budget,
      FACE_MOVES_NO_B, // B-free move set
    );
    if (solutions.length > 0 || budget.nodes >= budget.limit) break;
  }

  const seen = new Set<string>();
  return solutions.filter((sol) => {
    const key = sol.join(' ');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export interface CrossSolution {
  moves: Move[];
  frontFace: FaceColor;
  clean?: boolean;
}

const FRONT_FACES: FaceColor[] = ['B', 'R', 'G', 'O']; // yCount 0,1,2,3 after x2
const Y_PREMOVES: Move[][] = [[], ['y'], ['y2'], ["y'"]];

function hasBOrY(moves: Move[]): boolean {
  return moves.some((m) => m[0] === 'B' || m[0] === 'y');
}

export function solveAllCross(state: CubeState): CrossSolution[] {
  const allSolutions: CrossSolution[] = [];

  for (let yc = 0; yc < 4; yc++) {
    const premoves = Y_PREMOVES[yc]!;
    const rotatedState = premoves.length > 0 ? applyMoves(cloneState(state), premoves) : state;
    const solutions = solveDCross(rotatedState, yc);

    const frontFace = FRONT_FACES[yc]!;
    for (const sol of solutions) {
      allSolutions.push({
        moves: sol,
        frontFace,
      });
    }

    // If all solutions contain B or y, run clean secondary search
    const allHaveBOrY = solutions.length > 0 && solutions.every((sol) => hasBOrY(sol));
    if (allHaveBOrY) {
      const cleanSolutions = solveDCrossClean(rotatedState, yc);
      for (const sol of cleanSolutions) {
        allSolutions.push({
          moves: sol,
          frontFace,
          clean: true,
        });
      }
    }
  }

  return allSolutions;
}

// Re-export for testing
export { isDCrossSolved, dCrossHeuristic, getDCrossTargets, solveDCross, solveDCrossClean };
