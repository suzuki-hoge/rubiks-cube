import type { CubeState, Move, EdgePiece } from '../types';
import { applyMove } from './moves';
import { cloneState } from './pieces';

// White cross edges: UR=0, UF=1, UL=2, UB=3
// In solved state these should be at positions 0,1,2,3 with orientation 0
const CROSS_EDGES: EdgePiece[] = [0, 1, 2, 3];
const CROSS_MOVES: Move[] = [
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

function isCrossSolved(state: CubeState): boolean {
  return CROSS_EDGES.every((piece) => state.ep[piece] === piece && state.eo[piece] === 0);
}

// IDA* cross solver
function crossHeuristic(state: CubeState): number {
  let h = 0;
  for (const piece of CROSS_EDGES) {
    const pos = state.ep.indexOf(piece);
    if (pos !== piece || state.eo[pos] !== 0) {
      h++;
    }
  }
  return Math.ceil(h / 2); // rough admissible heuristic
}

function idaCrossDFS(
  state: CubeState,
  depth: number,
  maxDepth: number,
  lastMove: string | null,
  path: Move[],
  solutions: Move[][],
  maxSolutions: number,
): void {
  if (solutions.length >= maxSolutions) return;

  if (isCrossSolved(state)) {
    solutions.push([...path]);
    return;
  }

  if (depth >= maxDepth) return;
  if (depth + crossHeuristic(state) > maxDepth) return;

  for (const move of CROSS_MOVES) {
    // Prune: don't do same face twice in a row
    const face = move[0]!;
    if (lastMove && lastMove[0] === face) continue;
    // Prune: don't do opposite face if it was just done (e.g. U after D after U)
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
        // Only skip if the face letter comes after in alphabetical order
        // (arbitrary but consistent tie-breaking)
        if (face > lastMove[0]!) continue;
      }
    }

    const next = applyMove(state, move);
    path.push(move);
    idaCrossDFS(next, depth + 1, maxDepth, move, path, solutions, maxSolutions);
    path.pop();
  }
}

export function solveCross(state: CubeState, maxSolutions = 3): Move[][] {
  if (isCrossSolved(state)) return [[]];

  const solutions: Move[][] = [];

  for (let maxDepth = 1; maxDepth <= 8; maxDepth++) {
    idaCrossDFS(cloneState(state), 0, maxDepth, null, [], solutions, maxSolutions);
    if (solutions.length >= maxSolutions) break;
  }

  // Deduplicate by string representation
  const seen = new Set<string>();
  return solutions.filter((sol) => {
    const key = sol.join(' ');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
