import { describe, it, expect } from 'vitest';
import {
  applyMove,
  applyMoves,
  parseMove,
  parseMoveSequence,
  inverseMoveSequence,
} from '../cube/moves';
import { solvedState, isSolved } from '../cube/pieces';
import { stateToFacelets } from '../cube/convert';
import type { Move } from '../types';

// Expected 54-facelet strings for each single move from solved state.
// Facelet order: U(0-8) R(9-17) F(18-26) D(27-35) L(36-44) B(45-53)
// Colors: W=white(U) R=red(R) G=green(F) Y=yellow(D) O=orange(L) B=blue(B)
const EXPECTED_FACELETS: Record<string, string> = {
  R: 'WWGWWGWWGRRRRRRRRRGGYGGYGGYYYBYYBYYBOOOOOOOOOWBBWBBWBB',
  "R'": 'WWBWWBWWBRRRRRRRRRGGWGGWGGWYYGYYGYYGOOOOOOOOOYBBYBBYBB',
  L: 'BWWBWWBWWRRRRRRRRRWGGWGGWGGGYYGYYGYYOOOOOOOOOBBYBBYBBY',
  "L'": 'GWWGWWGWWRRRRRRRRRYGGYGGYGGBYYBYYBYYOOOOOOOOOBBWBBWBBW',
  U: 'WWWWWWWWWBBBRRRRRRRRRGGGGGGYYYYYYYYYGGGOOOOOOOOOBBBBBB',
  "U'": 'WWWWWWWWWGGGRRRRRROOOGGGGGGYYYYYYYYYBBBOOOOOORRRBBBBBB',
  D: 'WWWWWWWWWRRRRRRGGGGGGGGGOOOYYYYYYYYYOOOOOOBBBBBBBBBRRR',
  "D'": 'WWWWWWWWWRRRRRRBBBGGGGGGRRRYYYYYYYYYOOOOOOGGGBBBBBBOOO',
  F: 'WWWWWWOOOWRRWRRWRRGGGGGGGGGRRRYYYYYYOOYOOYOOYBBBBBBBBB',
  "F'": 'WWWWWWRRRYRRYRRYRRGGGGGGGGGOOOYYYYYYOOWOOWOOWBBBBBBBBB',
  B: 'RRRWWWWWWRRYRRYRRYGGGGGGGGGYYYYYYOOOWOOWOOWOOBBBBBBBBB',
  "B'": 'OOOWWWWWWRRWRRWRRWGGGGGGGGGYYYYYYRRRYOOYOOYOOBBBBBBBBB',
};

describe('moves - single move facelets', () => {
  it.each(Object.entries(EXPECTED_FACELETS))('%s produces correct facelets', (move, expected) => {
    const state = applyMove(solvedState(), move as Move);
    const facelets = stateToFacelets(state);
    expect(facelets.join('')).toBe(expected);
  });
});

describe('moves - known sequences', () => {
  it("sexy move (R U R' U') x6 returns to solved", () => {
    const sexy: Move[] = ['R', 'U', "R'", "U'"];
    const sequence = Array.from({ length: 6 }, () => sexy).flat();
    const result = applyMoves(solvedState(), sequence);
    expect(isSolved(result)).toBe(true);
  });

  it('T-perm is self-inverse (apply twice returns to solved)', () => {
    const tPerm: Move[] = [
      'R',
      'U',
      "R'",
      "U'",
      "R'",
      'F',
      'R2',
      "U'",
      "R'",
      "U'",
      'R',
      'U',
      "R'",
      "F'",
    ];
    const result = applyMoves(solvedState(), [...tPerm, ...tPerm]);
    expect(isSolved(result)).toBe(true);
  });
});

describe('parseMove', () => {
  it('parses valid moves', () => {
    expect(parseMove('R')).toBe('R');
    expect(parseMove("U'")).toBe("U'");
    expect(parseMove('F2')).toBe('F2');
    expect(parseMove('x')).toBe('x');
    expect(parseMove("y'")).toBe("y'");
  });

  it('returns null for invalid moves', () => {
    expect(parseMove('X')).toBeNull();
    expect(parseMove('M')).toBeNull();
    expect(parseMove('')).toBeNull();
    expect(parseMove('R3')).toBeNull();
  });
});

describe('parseMoveSequence', () => {
  it('parses space-separated moves', () => {
    expect(parseMoveSequence("R U R' U'")).toEqual(['R', 'U', "R'", "U'"]);
  });

  it('skips invalid moves', () => {
    expect(parseMoveSequence('R M U')).toEqual(['R', 'U']);
  });

  it('handles empty string', () => {
    expect(parseMoveSequence('')).toEqual([]);
  });
});

describe('inverseMoveSequence', () => {
  it('inverts a sequence correctly', () => {
    const original: Move[] = ['R', 'U', "F'", 'D2'];
    const inverted = inverseMoveSequence(original);
    expect(inverted).toEqual(['D2', 'F', "U'", "R'"]);
  });

  it('applying a sequence then its inverse returns to solved', () => {
    const seq: Move[] = ['R', 'U', "F'", 'D2', 'L', "B'"];
    const inv = inverseMoveSequence(seq);
    const result = applyMoves(solvedState(), [...seq, ...inv]);
    expect(isSolved(result)).toBe(true);
  });
});
