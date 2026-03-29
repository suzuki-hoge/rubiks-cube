import { useState, useEffect, useRef } from 'react';
import type { CubeState, Move } from '../types';
import type { SolutionsByFace } from '../cube/solutionSelector';
import type { CrossWorkerResponse } from '../workers/crossSolver.worker';

export function useCrossSolver(scrambledState: CubeState, scramble: Move[]) {
  const [solutionsByFace, setSolutionsByFace] = useState<SolutionsByFace>({});
  const [solving, setSolving] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/crossSolver.worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<CrossWorkerResponse>) => {
      const { requestId, solutionsByFace: result } = e.data;
      if (requestId !== requestIdRef.current) return;
      setSolutionsByFace(result);
      setSolving(false);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (scramble.length === 0) {
      setSolutionsByFace({});
      setSolving(false);
      return;
    }

    const id = ++requestIdRef.current;
    setSolutionsByFace({});
    setSolving(true);

    workerRef.current?.postMessage({
      requestId: id,
      state: scrambledState,
    });
  }, [scrambledState, scramble]);

  return { solutionsByFace, solving };
}
