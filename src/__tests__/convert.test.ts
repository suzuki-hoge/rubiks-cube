import { describe, it, expect } from 'vitest';
import { stateToFacelets } from '../cube/convert';
import { solvedState } from '../cube/pieces';
import { applyMove, applyMoves } from '../cube/moves';
import type { FaceColor, Move } from '../types';

describe('convert', () => {
  describe('stateToFacelets', () => {
    it('solved state produces correct facelet pattern', () => {
      const facelets = stateToFacelets(solvedState());
      expect(facelets).toHaveLength(54);

      // U face (0-8) should all be white
      for (let i = 0; i < 9; i++) {
        expect(facelets[i]).toBe('W');
      }
      // R face (9-17) should all be red
      for (let i = 9; i < 18; i++) {
        expect(facelets[i]).toBe('R');
      }
      // F face (18-26) should all be green
      for (let i = 18; i < 27; i++) {
        expect(facelets[i]).toBe('G');
      }
      // D face (27-35) should all be yellow
      for (let i = 27; i < 36; i++) {
        expect(facelets[i]).toBe('Y');
      }
      // L face (36-44) should all be orange
      for (let i = 36; i < 45; i++) {
        expect(facelets[i]).toBe('O');
      }
      // B face (45-53) should all be blue
      for (let i = 45; i < 54; i++) {
        expect(facelets[i]).toBe('B');
      }
    });

    it('centers remain fixed after any moves', () => {
      const moves: Move[] = ['R', 'U', "F'", 'D2', 'L', "B'"];
      const state = applyMoves(solvedState(), moves);
      const facelets = stateToFacelets(state);

      // Centers are at indices 4(U), 13(R), 22(F), 31(D), 40(L), 49(B)
      expect(facelets[4]).toBe('W');
      expect(facelets[13]).toBe('R');
      expect(facelets[22]).toBe('G');
      expect(facelets[31]).toBe('Y');
      expect(facelets[40]).toBe('O');
      expect(facelets[49]).toBe('B');
    });

    it('U move only changes U and adjacent facelets', () => {
      const state = applyMove(solvedState(), 'U');
      const facelets = stateToFacelets(state);

      // U face should still be all white (U only permutes within U + adjacent)
      for (let i = 0; i < 9; i++) {
        expect(facelets[i]).toBe('W');
      }
      // D face should be unchanged
      for (let i = 27; i < 36; i++) {
        expect(facelets[i]).toBe('Y');
      }
    });

    it('each color appears exactly 9 times after any move sequence', () => {
      const moves: Move[] = ['R', "U'", 'F', 'D2', "L'", 'B'];
      const state = applyMoves(solvedState(), moves);
      const facelets = stateToFacelets(state);

      const counts: Record<FaceColor, number> = { W: 0, Y: 0, R: 0, O: 0, B: 0, G: 0 };
      for (const f of facelets) {
        counts[f]++;
      }
      expect(counts.W).toBe(9);
      expect(counts.Y).toBe(9);
      expect(counts.R).toBe(9);
      expect(counts.O).toBe(9);
      expect(counts.B).toBe(9);
      expect(counts.G).toBe(9);
    });

    it('R move changes R face and adjacent columns correctly', () => {
      const state = applyMove(solvedState(), 'R');
      const facelets = stateToFacelets(state);

      // R face should be all red still (same color, just permuted)
      for (let i = 9; i < 18; i++) {
        expect(facelets[i]).toBe('R');
      }
    });

    function getRow(facelets: FaceColor[], start: number, row: number): FaceColor[] {
      return [
        facelets[start + row * 3]!,
        facelets[start + row * 3 + 1]!,
        facelets[start + row * 3 + 2]!,
      ];
    }

    function getCol(facelets: FaceColor[], start: number, col: number): FaceColor[] {
      return [facelets[start + col]!, facelets[start + 3 + col]!, facelets[start + 6 + col]!];
    }

    // Each face move should keep its own face color intact
    it.each([
      ['U', 'W', 0],
      ['D', 'Y', 27],
      ['R', 'R', 9],
      ['L', 'O', 36],
      ['F', 'G', 18],
      ['B', 'B', 45],
    ] as [Move, FaceColor, number][])('%s move keeps its own face all %s', (move, color, start) => {
      const facelets = stateToFacelets(applyMove(solvedState(), move));
      for (let i = start; i < start + 9; i++) {
        expect(facelets[i]).toBe(color);
      }
    });

    // U move (CW from above): B top -> R top, R top -> F top, F top -> L top, L top -> B top
    it('U move cycles adjacent top rows correctly (B->R->F->L->B)', () => {
      const facelets = stateToFacelets(applyMove(solvedState(), 'U'));
      // CW from above: B->R, R->F, F->L, L->B
      expect(getRow(facelets, 9, 0)).toEqual(['B', 'B', 'B']); // R top = old B
      expect(getRow(facelets, 18, 0)).toEqual(['R', 'R', 'R']); // F top = old R
      expect(getRow(facelets, 36, 0)).toEqual(['G', 'G', 'G']); // L top = old F
      expect(getRow(facelets, 45, 0)).toEqual(['O', 'O', 'O']); // B top = old L
    });

    // D move (CW from below): F bottom -> R bottom, R bottom -> B bottom, B bottom -> L bottom, L bottom -> F bottom
    it('D move cycles adjacent bottom rows correctly', () => {
      const facelets = stateToFacelets(applyMove(solvedState(), 'D'));
      // CW from below: F->R, R->B, B->L, L->F
      expect(getRow(facelets, 9, 2)).toEqual(['G', 'G', 'G']); // R bottom = old F
      expect(getRow(facelets, 45, 2)).toEqual(['R', 'R', 'R']); // B bottom = old R
      expect(getRow(facelets, 36, 2)).toEqual(['B', 'B', 'B']); // L bottom = old B
      expect(getRow(facelets, 18, 2)).toEqual(['O', 'O', 'O']); // F bottom = old L
    });

    // F move (CW from front): U bottom -> R left col -> D top (rev) -> L right col (rev) -> U bottom
    it('F move cycles adjacent facelets correctly', () => {
      const facelets = stateToFacelets(applyMove(solvedState(), 'F'));
      // U bottom row = old L right col reversed = O O O
      expect(getRow(facelets, 0, 2)).toEqual(['O', 'O', 'O']);
      // R left col = old U bottom row = W W W
      expect(getCol(facelets, 9, 0)).toEqual(['W', 'W', 'W']);
      // D top row = old R left col reversed = R R R
      expect(getRow(facelets, 27, 0)).toEqual(['R', 'R', 'R']);
      // L right col = old D top row reversed = Y Y Y
      expect(getCol(facelets, 36, 2)).toEqual(['Y', 'Y', 'Y']);
    });

    // B move (CW from behind): U top -> L left col (rev) -> D bottom -> R right col (rev) -> U top
    it('B move cycles adjacent facelets correctly', () => {
      const facelets = stateToFacelets(applyMove(solvedState(), 'B'));
      // U top row = old R right col = R R R
      expect(getRow(facelets, 0, 0)).toEqual(['R', 'R', 'R']);
      // R right col = old D bottom row reversed = Y Y Y
      expect(getCol(facelets, 9, 2)).toEqual(['Y', 'Y', 'Y']);
      // D bottom row = old L left col = O O O
      expect(getRow(facelets, 27, 2)).toEqual(['O', 'O', 'O']);
      // L left col = old U top row reversed = W W W
      expect(getCol(facelets, 36, 0)).toEqual(['W', 'W', 'W']);
    });

    // R move: U right col -> B left col (rev) -> D right col -> F right col -> U right col
    it('R move cycles adjacent columns correctly', () => {
      const facelets = stateToFacelets(applyMove(solvedState(), 'R'));
      // U right col = old F right col = G G G
      expect(getCol(facelets, 0, 2)).toEqual(['G', 'G', 'G']);
      // F right col = old D right col = Y Y Y
      expect(getCol(facelets, 18, 2)).toEqual(['Y', 'Y', 'Y']);
      // D right col = old B left col reversed = B B B
      expect(getCol(facelets, 27, 2)).toEqual(['B', 'B', 'B']);
      // B left col = old U right col reversed = W W W
      expect(getCol(facelets, 45, 0)).toEqual(['W', 'W', 'W']);
    });

    // L move: U left col -> F left col -> D left col -> B right col (rev) -> U left col
    it('L move cycles adjacent columns correctly', () => {
      const facelets = stateToFacelets(applyMove(solvedState(), 'L'));
      // U left col = old B right col reversed = B B B
      expect(getCol(facelets, 0, 0)).toEqual(['B', 'B', 'B']);
      // F left col = old U left col = W W W
      expect(getCol(facelets, 18, 0)).toEqual(['W', 'W', 'W']);
      // D left col = old F left col = G G G
      expect(getCol(facelets, 27, 0)).toEqual(['G', 'G', 'G']);
      // B right col = old D left col reversed = Y Y Y
      expect(getCol(facelets, 45, 2)).toEqual(['Y', 'Y', 'Y']);
    });
  });
});
