import { useReducer, useCallback } from 'react';
import type { CubeState, Move, FaceColor } from '../types';
import { solvedState, cloneState } from '../cube/pieces';
import { applyMove, applyMoves } from '../cube/moves';
import { generateScramble } from '../cube/scrambler';
import { DEFAULT_CENTERS } from '../cube/convert';

// Center permutations for rotation moves: centerPerm[i] = source index
// Centers indexed: 0=U, 1=R, 2=F, 3=D, 4=L, 5=B
const CENTER_PERMS: Partial<Record<Move, number[]>> = {
  x: [2, 1, 3, 5, 4, 0], // U←F, R←R, F←D, D←B, L←L, B←U
  "x'": [5, 1, 0, 2, 4, 3], // U←B, R←R, F←U, D←F, L←L, B←D
  x2: [3, 1, 5, 0, 4, 2], // U←D, R←R, F←B, D←U, L←L, B←F
  y: [0, 5, 1, 3, 2, 4], // U←U, R←B, F←R, D←D, L←F, B←L
  "y'": [0, 2, 4, 3, 5, 1], // U←U, R←F, F←L, D←D, L←B, B←R
  y2: [0, 4, 5, 3, 1, 2], // U←U, R←L, F←B, D←D, L←R, B←F
  z: [4, 0, 2, 1, 3, 5], // U←L, R←U, F←F, D←R, L←D, B←B
  "z'": [1, 3, 2, 4, 0, 5], // U←R, R←D, F←F, D←L, L←U, B←B
  z2: [3, 4, 2, 0, 1, 5], // U←D, R←L, F←F, D←U, L←R, B←B
};

function applyCenterPerm(centers: FaceColor[], perm: number[]): FaceColor[] {
  return perm.map((i) => centers[i]!) as FaceColor[];
}

function applyCentersForMove(centers: FaceColor[], move: Move): FaceColor[] {
  const perm = CENTER_PERMS[move];
  return perm ? applyCenterPerm(centers, perm) : centers;
}

function applyCentersForMoves(centers: FaceColor[], moves: Move[]): FaceColor[] {
  let c = centers;
  for (const m of moves) {
    c = applyCentersForMove(c, m);
  }
  return c;
}

interface CubeStore {
  state: CubeState;
  centers: FaceColor[];
  scramble: Move[];
  scrambledState: CubeState;
  scrambledCenters: FaceColor[];
  moveHistory: Move[];
  animatingMove: Move | null;
}

type CubeAction =
  | { type: 'EXECUTE_MOVE'; move: Move }
  | { type: 'SHUFFLE' }
  | { type: 'RETRY' }
  | { type: 'SET_ANIMATING'; move: Move | null }
  | { type: 'UNDO' };

function initStore(): CubeStore {
  const state = solvedState();
  const centers = [...DEFAULT_CENTERS] as FaceColor[];
  return {
    state,
    centers,
    scramble: [],
    scrambledState: cloneState(state),
    scrambledCenters: [...centers],
    moveHistory: [],
    animatingMove: null,
  };
}

function reducer(store: CubeStore, action: CubeAction): CubeStore {
  switch (action.type) {
    case 'EXECUTE_MOVE': {
      const newState = applyMove(store.state, action.move);
      const newCenters = applyCentersForMove(store.centers, action.move);
      return {
        ...store,
        state: newState,
        centers: newCenters,
        moveHistory: [...store.moveHistory, action.move],
      };
    }
    case 'SHUFFLE': {
      const scramble = generateScramble();
      // Apply scramble then x2 so white is on bottom
      const allMoves: Move[] = [...scramble, 'x2'];
      const scrambledState = applyMoves(solvedState(), allMoves);
      const scrambledCenters = applyCentersForMoves([...DEFAULT_CENTERS] as FaceColor[], allMoves);
      return {
        state: cloneState(scrambledState),
        centers: [...scrambledCenters],
        scramble, // store original scramble (without x2) for display
        scrambledState,
        scrambledCenters,
        moveHistory: [],
        animatingMove: null,
      };
    }
    case 'RETRY': {
      return {
        ...store,
        state: cloneState(store.scrambledState),
        centers: [...store.scrambledCenters],
        moveHistory: [],
        animatingMove: null,
      };
    }
    case 'SET_ANIMATING': {
      return { ...store, animatingMove: action.move };
    }
    case 'UNDO': {
      if (store.moveHistory.length === 0) return store;
      const newHistory = store.moveHistory.slice(0, -1);
      const newState = applyMoves(cloneState(store.scrambledState), newHistory);
      const newCenters = applyCentersForMoves([...store.scrambledCenters], newHistory);
      return {
        ...store,
        state: newState,
        centers: newCenters,
        moveHistory: newHistory,
      };
    }
    default:
      return store;
  }
}

export function useCubeState() {
  const [store, dispatch] = useReducer(reducer, null, initStore);

  const executeMove = useCallback((move: Move) => {
    dispatch({ type: 'EXECUTE_MOVE', move });
  }, []);

  const shuffle = useCallback(() => {
    dispatch({ type: 'SHUFFLE' });
  }, []);

  const retry = useCallback(() => {
    dispatch({ type: 'RETRY' });
  }, []);

  const setAnimating = useCallback((move: Move | null) => {
    dispatch({ type: 'SET_ANIMATING', move });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  return {
    cubeState: store.state,
    centers: store.centers,
    scramble: store.scramble,
    scrambledState: store.scrambledState,
    moveHistory: store.moveHistory,
    animatingMove: store.animatingMove,
    executeMove,
    shuffle,
    retry,
    setAnimating,
    undo,
  };
}
