import { solveAllCross } from '../cube/crossSolver';
import { selectAllFaces } from '../cube/solutionSelector';
import type { SolutionsByFace } from '../cube/solutionSelector';
import type { CubeState } from '../types';

export interface CrossWorkerRequest {
  requestId: number;
  state: CubeState;
}

export interface CrossWorkerResponse {
  requestId: number;
  solutionsByFace: SolutionsByFace;
}

self.onmessage = (e: MessageEvent<CrossWorkerRequest>) => {
  const { requestId, state } = e.data;
  const raw = solveAllCross(state);
  const solutionsByFace = selectAllFaces(raw);
  self.postMessage({ requestId, solutionsByFace } satisfies CrossWorkerResponse);
};
