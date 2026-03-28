import type { Move } from '../types';

const FACES = ['U', 'D', 'R', 'L', 'F', 'B'] as const;
const SUFFIXES = ['', "'", '2'] as const;

// Generate a random-move scramble (20 moves, no consecutive same-face)
export function generateScramble(length = 20): Move[] {
  const moves: Move[] = [];
  let lastFace = -1;
  let secondLastFace = -1;

  for (let i = 0; i < length; i++) {
    let faceIdx: number;
    do {
      faceIdx = Math.floor(Math.random() * 6);
      // Avoid same face as last move
      // Avoid same axis (opposite faces) if last two moves were on that axis
    } while (
      faceIdx === lastFace ||
      // If last two were on same axis (e.g. U then D), don't pick either
      (secondLastFace !== -1 &&
        Math.floor(faceIdx / 2) === Math.floor(lastFace / 2) &&
        Math.floor(lastFace / 2) === Math.floor(secondLastFace / 2))
    );

    const suffix = SUFFIXES[Math.floor(Math.random() * 3)]!;
    const face = FACES[faceIdx]!;
    moves.push(`${face}${suffix}` as Move);

    secondLastFace = lastFace;
    lastFace = faceIdx;
  }

  return moves;
}

export function scrambleToString(moves: Move[]): string {
  return moves.join(' ');
}
