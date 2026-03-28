import { useReducer, useCallback } from 'react';
import type { CubeState, Move } from '../types';
import { solvedState, cloneState } from '../cube/pieces';
import { applyMove, applyMoves } from '../cube/moves';
import { generateScramble } from '../cube/scrambler';

interface CubeStore {
  state: CubeState;
  scramble: Move[];
  scrambledState: CubeState;
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
  return {
    state,
    scramble: [],
    scrambledState: cloneState(state),
    moveHistory: [],
    animatingMove: null,
  };
}

function reducer(store: CubeStore, action: CubeAction): CubeStore {
  switch (action.type) {
    case 'EXECUTE_MOVE': {
      const newState = applyMove(store.state, action.move);
      return {
        ...store,
        state: newState,
        moveHistory: [...store.moveHistory, action.move],
      };
    }
    case 'SHUFFLE': {
      const scramble = generateScramble();
      const scrambledState = applyMoves(solvedState(), scramble);
      return {
        state: cloneState(scrambledState),
        scramble,
        scrambledState,
        moveHistory: [],
        animatingMove: null,
      };
    }
    case 'RETRY': {
      return {
        ...store,
        state: cloneState(store.scrambledState),
        moveHistory: [],
        animatingMove: null,
      };
    }
    case 'SET_ANIMATING': {
      return { ...store, animatingMove: action.move };
    }
    case 'UNDO': {
      if (store.moveHistory.length === 0) return store;
      // Replay all moves except the last one
      const newHistory = store.moveHistory.slice(0, -1);
      const newState = applyMoves(cloneState(store.scrambledState), newHistory);
      return {
        ...store,
        state: newState,
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
