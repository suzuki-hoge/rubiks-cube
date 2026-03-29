import type { FaceColor, FaceName } from '../types';

export const FACE_COLORS: Record<FaceColor, string> = {
  W: '#FFFFFF', // U - White
  Y: '#FFED00', // D - Yellow
  R: '#DD1736', // R - Red
  O: '#FF6D00', // L - Orange
  B: '#0061D5', // B - Blue
  G: '#00B74A', // F - Green
};

export const FACE_TO_COLOR: Record<FaceName, FaceColor> = {
  U: 'W',
  D: 'Y',
  R: 'R',
  L: 'O',
  F: 'G',
  B: 'B',
};

export const CUBE_BODY_COLOR = '#1a1a1a';

// Corner piece colors: [U/D face, clockwise face 1, clockwise face 2]
export const CORNER_COLORS: [FaceColor, FaceColor, FaceColor][] = [
  ['W', 'R', 'G'], // 0: URF
  ['W', 'G', 'O'], // 1: UFL
  ['W', 'O', 'B'], // 2: ULB
  ['W', 'B', 'R'], // 3: UBR
  ['Y', 'G', 'R'], // 4: DFR
  ['Y', 'O', 'G'], // 5: DLF
  ['Y', 'B', 'O'], // 6: DBL
  ['Y', 'R', 'B'], // 7: DRB
];

// Edge piece colors: [primary face, secondary face]
export const EDGE_COLORS: [FaceColor, FaceColor][] = [
  ['W', 'R'], // 0: UR
  ['W', 'G'], // 1: UF
  ['W', 'O'], // 2: UL
  ['W', 'B'], // 3: UB
  ['Y', 'R'], // 4: DR
  ['Y', 'G'], // 5: DF
  ['Y', 'O'], // 6: DL
  ['Y', 'B'], // 7: DB
  ['G', 'R'], // 8: FR
  ['G', 'O'], // 9: FL
  ['B', 'O'], // 10: BL
  ['B', 'R'], // 11: BR
];
