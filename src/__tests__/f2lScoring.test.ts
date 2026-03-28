import { describe, it, expect } from 'vitest';
import { scoreF2LPairs, F2L_SLOTS } from '../cube/f2lScoring';
import { solvedState } from '../cube/pieces';
import { applyMoves } from '../cube/moves';
import type { Settings, Move } from '../types';
import { DEFAULT_SETTINGS } from '../hooks/useSettings';

function defaultF2LSettings(): Settings {
  return { ...DEFAULT_SETTINGS };
}

function findSlot(scores: ReturnType<typeof scoreF2LPairs>, name: string) {
  return scores.find((s) => s.slot.name === name)!;
}

describe('f2lScoring', () => {
  describe('basic structure', () => {
    it('returns 4 scores for any state', () => {
      const scores = scoreF2LPairs(solvedState(), defaultF2LSettings());
      expect(scores).toHaveLength(4);
    });

    it('each score references a unique slot', () => {
      const scores = scoreF2LPairs(solvedState(), defaultF2LSettings());
      const slotNames = scores.map((s) => s.slot.name);
      expect(new Set(slotNames).size).toBe(4);
    });

    it('all 4 F2L slot names are present', () => {
      const scores = scoreF2LPairs(solvedState(), defaultF2LSettings());
      const slotNames = new Set(scores.map((s) => s.slot.name));
      expect(slotNames.has('RF')).toBe(true);
      expect(slotNames.has('LF')).toBe(true);
      expect(slotNames.has('LB')).toBe(true);
      expect(slotNames.has('RB')).toBe(true);
    });

    it('scores are sorted in descending order', () => {
      const moves: Move[] = ['R', 'U', "F'", 'D2'];
      const state = applyMoves(solvedState(), moves);
      const scores = scoreF2LPairs(state, defaultF2LSettings());

      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]!.score).toBeLessThanOrEqual(scores[i - 1]!.score);
      }
    });
  });

  describe('solved state scoring', () => {
    it('all edges have good EO in solved state', () => {
      const scores = scoreF2LPairs(solvedState(), defaultF2LSettings());
      for (const s of scores) {
        expect(s.eoGood).toBe(true);
      }
    });

    it('visibility in solved state matches viewpoint (U+F+R visible)', () => {
      const scores = scoreF2LPairs(solvedState(), defaultF2LSettings());
      // RF(URF): 3 visible faces → corner visible, FR edge visible
      expect(findSlot(scores, 'RF').cornerVisible).toBe(true);
      expect(findSlot(scores, 'RF').edgeVisible).toBe(true);
      // LF(UFL): 2 visible faces → corner visible, FL edge visible
      expect(findSlot(scores, 'LF').cornerVisible).toBe(true);
      expect(findSlot(scores, 'LF').edgeVisible).toBe(true);
      // LB(ULB): 1 visible face → corner NOT visible, BL edge visible by elimination
      expect(findSlot(scores, 'LB').cornerVisible).toBe(false);
      expect(findSlot(scores, 'LB').edgeVisible).toBe(true);
      // RB(UBR): 2 visible faces → corner visible, BR edge visible
      expect(findSlot(scores, 'RB').cornerVisible).toBe(true);
      expect(findSlot(scores, 'RB').edgeVisible).toBe(true);
    });

    it('RB scores higher than front slots; LB ties with front (corner not visible)', () => {
      const scores = scoreF2LPairs(solvedState(), defaultF2LSettings());
      const lb = findSlot(scores, 'LB');
      const rb = findSlot(scores, 'RB');
      const rf = findSlot(scores, 'RF');
      const lf = findSlot(scores, 'LF');

      // RB: eo(30) + back(30) + both(40) = 100
      expect(rb.score).toBeGreaterThan(rf.score);
      expect(rb.score).toBeGreaterThan(lf.score);
      // LB: eo(30) + back(30) + edgeOnly(10) = 70 = same as front slots
      expect(lb.score).toBe(rf.score);
      expect(lb.score).toBe(lf.score);
    });

    it('solved state scores match expected formula', () => {
      const s = defaultF2LSettings();
      const scores = scoreF2LPairs(solvedState(), s);

      // Front slots: eoBonus + visibilityBothBonus = 30 + 40 = 70
      const expectedFront = s.f2l.eoBonus + s.f2l.visibilityBothBonus;
      expect(findSlot(scores, 'RF').score).toBe(expectedFront);
      expect(findSlot(scores, 'LF').score).toBe(expectedFront);

      // RB: eoBonus + backSlotBonus + visibilityBothBonus = 30 + 30 + 40 = 100
      const expectedRB = s.f2l.eoBonus + s.f2l.backSlotBonus + s.f2l.visibilityBothBonus;
      expect(findSlot(scores, 'RB').score).toBe(expectedRB);

      // LB: eoBonus + backSlotBonus + visibilityEdgeOnlyBonus = 30 + 30 + 10 = 70
      // (ULB corner has only 1 visible face, so corner NOT visible → edgeOnly)
      const expectedLB = s.f2l.eoBonus + s.f2l.backSlotBonus + s.f2l.visibilityEdgeOnlyBonus;
      expect(findSlot(scores, 'LB').score).toBe(expectedLB);
    });
  });

  describe('EO detection', () => {
    it('F move flips F-layer edge orientations', () => {
      // F flips EO of UF, DF, FR, FL
      const state = applyMoves(solvedState(), ['F']);
      const scores = scoreF2LPairs(state, defaultF2LSettings());

      // RF edge (piece 8=FR) moved to DF position with bad EO
      expect(findSlot(scores, 'RF').eoGood).toBe(false);
      // LF edge (piece 9=FL) moved to UF position with bad EO
      expect(findSlot(scores, 'LF').eoGood).toBe(false);
      // LB and RB edges (BL, BR) are unaffected by F
      expect(findSlot(scores, 'LB').eoGood).toBe(true);
      expect(findSlot(scores, 'RB').eoGood).toBe(true);
    });

    it('R and U moves do not flip edge orientations', () => {
      const state = applyMoves(solvedState(), ['R', 'U', "R'", "U'"]);
      const scores = scoreF2LPairs(state, defaultF2LSettings());

      // R and U never flip EO
      for (const s of scores) {
        expect(s.eoGood).toBe(true);
      }
    });
  });

  describe('visibility', () => {
    it('R2 puts URF corner at DRB (not visible)', () => {
      // R2 sends piece 0 (URF) to position 7 (DRB), which has only 1 visible face
      const state = applyMoves(solvedState(), ['R2']);
      const scores = scoreF2LPairs(state, defaultF2LSettings());
      const rf = findSlot(scores, 'RF');
      expect(rf.cornerVisible).toBe(false);
    });

    it('R2 keeps FR edge visible (at BR position)', () => {
      // R2 sends piece 8 (FR) to position 11 (BR), which is visible (R face)
      const state = applyMoves(solvedState(), ['R2']);
      const scores = scoreF2LPairs(state, defaultF2LSettings());
      const rf = findSlot(scores, 'RF');
      expect(rf.edgeVisible).toBe(true);
    });

    it('L2 puts FL edge at BL (not directly visible)', () => {
      // L2 sends piece 9 (FL) to position 10 (BL), which is not visible
      const state = applyMoves(solvedState(), ['L2']);
      const scores = scoreF2LPairs(state, defaultF2LSettings());
      // BL is not visible, but elimination rule might make it deducible
      // (depends on other F2L edge positions)
      const lf = findSlot(scores, 'LF');
      expect(lf.edgeVisible).toBe(true); // visible by elimination (other 3 edges visible)
    });

    it('corner at DBL (position 6) is not visible', () => {
      // Need to get an F2L corner to position 6 (DBL)
      // B move: UBR(3) -> ULB(2) -> DBL(6)
      // B2 sends corner 2 (ULB) to position 6 (DBL)... let me check
      // B: cp=[0,1,3,7,4,5,2,6], so B sends piece at pos 2 to pos 6
      // After B from solved: cp[6]=2, so piece 2 (ULB) is at position 6 (DBL)
      const state = applyMoves(solvedState(), ['B']);
      const scores = scoreF2LPairs(state, defaultF2LSettings());
      const lb = findSlot(scores, 'LB');
      // LB corner piece is 2, now at position 6 (DBL) with 0 visible faces
      expect(lb.cornerVisible).toBe(false);
    });
  });

  describe('score after R2', () => {
    it('produces correct per-slot scores after R2', () => {
      const s = defaultF2LSettings();
      const state = applyMoves(solvedState(), ['R2']);
      const scores = scoreF2LPairs(state, s);

      // RF: corner not visible, edge visible, EO good, not back
      // = eoBonus + edgeOnlyBonus = 30 + 10 = 40
      expect(findSlot(scores, 'RF').score).toBe(s.f2l.eoBonus + s.f2l.visibilityEdgeOnlyBonus);

      // LF: corner visible, edge visible, EO good, not back
      // = eoBonus + bothBonus = 30 + 40 = 70
      expect(findSlot(scores, 'LF').score).toBe(s.f2l.eoBonus + s.f2l.visibilityBothBonus);

      // RB: corner visible (at DFR), edge visible (at FR), EO good, back
      // = eoBonus + backBonus + bothBonus = 30 + 30 + 40 = 100
      expect(findSlot(scores, 'RB').score).toBe(
        s.f2l.eoBonus + s.f2l.backSlotBonus + s.f2l.visibilityBothBonus,
      );
    });
  });

  describe('settings affect scoring', () => {
    it('zeroing all bonuses gives all zero scores', () => {
      const settings = defaultF2LSettings();
      settings.f2l = {
        eoBonus: 0,
        backSlotBonus: 0,
        visibilityBothBonus: 0,
        visibilityCornerOnlyBonus: 0,
        visibilityEdgeOnlyBonus: 0,
      };
      const scores = scoreF2LPairs(solvedState(), settings);
      for (const s of scores) {
        expect(s.score).toBe(0);
      }
    });

    it('only backSlotBonus separates back from front in solved state', () => {
      const settings = defaultF2LSettings();
      settings.f2l = {
        eoBonus: 0,
        backSlotBonus: 50,
        visibilityBothBonus: 0,
        visibilityCornerOnlyBonus: 0,
        visibilityEdgeOnlyBonus: 0,
      };
      const scores = scoreF2LPairs(solvedState(), settings);
      expect(findSlot(scores, 'LB').score).toBe(50);
      expect(findSlot(scores, 'RB').score).toBe(50);
      expect(findSlot(scores, 'RF').score).toBe(0);
      expect(findSlot(scores, 'LF').score).toBe(0);
    });

    it('high EO bonus makes EO the dominant factor', () => {
      const settings = defaultF2LSettings();
      settings.f2l.eoBonus = 100;
      settings.f2l.backSlotBonus = 0;
      settings.f2l.visibilityBothBonus = 0;
      settings.f2l.visibilityCornerOnlyBonus = 0;
      settings.f2l.visibilityEdgeOnlyBonus = 0;

      // F flips FR and FL edges
      const state = applyMoves(solvedState(), ['F']);
      const scores = scoreF2LPairs(state, settings);

      const eoGoodScores = scores.filter((s) => s.eoGood);
      const eoBadScores = scores.filter((s) => !s.eoGood);

      expect(eoGoodScores.length).toBeGreaterThan(0);
      expect(eoBadScores.length).toBeGreaterThan(0);
      expect(eoGoodScores[0]!.score).toBeGreaterThan(eoBadScores[0]!.score);
    });
  });

  describe('slot definitions', () => {
    it('F2L_SLOTS has correct structure', () => {
      expect(F2L_SLOTS).toHaveLength(4);
      expect(F2L_SLOTS[0]!.name).toBe('RF');
      expect(F2L_SLOTS[0]!.cornerPiece).toBe(0);
      expect(F2L_SLOTS[0]!.edgePiece).toBe(8);
      expect(F2L_SLOTS[0]!.isBackSlot).toBe(false);

      expect(F2L_SLOTS[2]!.name).toBe('LB');
      expect(F2L_SLOTS[2]!.isBackSlot).toBe(true);

      expect(F2L_SLOTS[3]!.name).toBe('RB');
      expect(F2L_SLOTS[3]!.isBackSlot).toBe(true);
    });
  });
});
