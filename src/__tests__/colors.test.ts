import { describe, it, expect } from 'vitest';
import { FACE_COLORS, CORNER_COLORS, EDGE_COLORS } from '../cube/colors';

describe('colors', () => {
  it('has 6 face colors defined', () => {
    expect(Object.keys(FACE_COLORS)).toHaveLength(6);
  });

  it('face colors match spec', () => {
    expect(FACE_COLORS.W).toBe('#FFFFFF');
    expect(FACE_COLORS.Y).toBe('#FFD500');
    expect(FACE_COLORS.R).toBe('#B71234');
    expect(FACE_COLORS.O).toBe('#FF5800');
    expect(FACE_COLORS.B).toBe('#0046AD');
    expect(FACE_COLORS.G).toBe('#009B48');
  });

  it('has 8 corner color definitions', () => {
    expect(CORNER_COLORS).toHaveLength(8);
  });

  it('each corner has 3 colors', () => {
    for (const colors of CORNER_COLORS) {
      expect(colors).toHaveLength(3);
    }
  });

  it('corners 0-3 have white as first color (U-layer)', () => {
    for (let i = 0; i < 4; i++) {
      expect(CORNER_COLORS[i]![0]).toBe('W');
    }
  });

  it('corners 4-7 have yellow as first color (D-layer)', () => {
    for (let i = 4; i < 8; i++) {
      expect(CORNER_COLORS[i]![0]).toBe('Y');
    }
  });

  it('has 12 edge color definitions', () => {
    expect(EDGE_COLORS).toHaveLength(12);
  });

  it('each edge has 2 colors', () => {
    for (const colors of EDGE_COLORS) {
      expect(colors).toHaveLength(2);
    }
  });

  it('edges 0-3 have white as first color (U-layer)', () => {
    for (let i = 0; i < 4; i++) {
      expect(EDGE_COLORS[i]![0]).toBe('W');
    }
  });

  it('edges 4-7 have yellow as first color (D-layer)', () => {
    for (let i = 4; i < 8; i++) {
      expect(EDGE_COLORS[i]![0]).toBe('Y');
    }
  });

  it('no corner has duplicate colors', () => {
    for (const colors of CORNER_COLORS) {
      expect(new Set(colors).size).toBe(3);
    }
  });

  it('no edge has duplicate colors', () => {
    for (const colors of EDGE_COLORS) {
      expect(new Set(colors).size).toBe(2);
    }
  });
});
