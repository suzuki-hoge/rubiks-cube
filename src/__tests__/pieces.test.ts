import { describe, it, expect } from 'vitest';
import { solvedState, cloneState, isSolved } from '../cube/pieces';

describe('pieces', () => {
  it('solvedState returns a valid solved cube', () => {
    const s = solvedState();
    expect(s.cp).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(s.co).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(s.ep).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(s.eo).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('isSolved returns true for solved state', () => {
    expect(isSolved(solvedState())).toBe(true);
  });

  it('cloneState creates a deep copy', () => {
    const s = solvedState();
    const c = cloneState(s);
    c.cp[0] = 3;
    c.co[0] = 1;
    c.ep[0] = 5;
    c.eo[0] = 1;
    // Original should be unchanged
    expect(s.cp[0]).toBe(0);
    expect(s.co[0]).toBe(0);
    expect(s.ep[0]).toBe(0);
    expect(s.eo[0]).toBe(0);
  });

  it('isSolved returns false for modified state', () => {
    const s = solvedState();
    s.cp[0] = 1;
    s.cp[1] = 0;
    expect(isSolved(s)).toBe(false);
  });
});
