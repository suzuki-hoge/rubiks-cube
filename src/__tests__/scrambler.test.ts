import { describe, it, expect } from 'vitest';
import { generateScramble, scrambleToString } from '../cube/scrambler';
import { applyMoves } from '../cube/moves';
import { solvedState, isSolved } from '../cube/pieces';

describe('scrambler', () => {
  it('generates a scramble of default length 20', () => {
    const scramble = generateScramble();
    expect(scramble).toHaveLength(20);
  });

  it('generates a scramble of specified length', () => {
    const scramble = generateScramble(10);
    expect(scramble).toHaveLength(10);
  });

  it('no two consecutive moves share the same face', () => {
    for (let trial = 0; trial < 50; trial++) {
      const scramble = generateScramble();
      for (let i = 1; i < scramble.length; i++) {
        const prevFace = scramble[i - 1]![0];
        const currFace = scramble[i]![0];
        expect(currFace).not.toBe(prevFace);
      }
    }
  });

  it('all moves are valid face moves', () => {
    const validFaces = ['U', 'D', 'R', 'L', 'F', 'B'];
    const validSuffixes = ['', "'", '2'];
    const scramble = generateScramble();
    for (const move of scramble) {
      const face = move[0]!;
      const suffix = move.slice(1);
      expect(validFaces).toContain(face);
      expect(validSuffixes).toContain(suffix);
    }
  });

  it('scramble actually changes the cube state', () => {
    // With 20 random moves, it's astronomically unlikely to return to solved
    const scramble = generateScramble();
    const state = applyMoves(solvedState(), scramble);
    expect(isSolved(state)).toBe(false);
  });

  it('scrambleToString formats correctly', () => {
    const s = scrambleToString(['R', "U'", 'F2']);
    expect(s).toBe("R U' F2");
  });
});
