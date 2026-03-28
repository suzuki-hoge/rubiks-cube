import type {
  CubeState,
  CornerPiece,
  EdgePiece,
  CornerOrientation,
  EdgeOrientation,
} from '../types';

export function solvedState(): CubeState {
  return {
    cp: [0, 1, 2, 3, 4, 5, 6, 7] as CornerPiece[],
    co: [0, 0, 0, 0, 0, 0, 0, 0] as CornerOrientation[],
    ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as EdgePiece[],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as EdgeOrientation[],
  };
}

export function cloneState(s: CubeState): CubeState {
  return {
    cp: [...s.cp] as CornerPiece[],
    co: [...s.co] as CornerOrientation[],
    ep: [...s.ep] as EdgePiece[],
    eo: [...s.eo] as EdgeOrientation[],
  };
}

export function isSolved(s: CubeState): boolean {
  const solved = solvedState();
  return (
    s.cp.every((v, i) => v === solved.cp[i]) &&
    s.co.every((v, i) => v === solved.co[i]) &&
    s.ep.every((v, i) => v === solved.ep[i]) &&
    s.eo.every((v, i) => v === solved.eo[i])
  );
}
