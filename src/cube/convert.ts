import type { CubeState, FaceColor } from '../types';
import { CORNER_COLORS, EDGE_COLORS } from './colors';

// Facelet ordering: U0-U8, R0-R8, F0-F8, D0-D8, L0-L8, B0-B8
// Each face indexed:
//   0 1 2
//   3 4 5
//   6 7 8

// Corner facelet positions: for each corner position, which 3 facelets it occupies
// [U/D facelet, CW facelet, CCW facelet] matching orientation 0,1,2
const CORNER_FACELETS: [number, number, number][] = [
  [8, 9 + 0, 18 + 2], // 0: URF -> U8, R0, F2
  [6, 18 + 0, 36 + 2], // 1: UFL -> U6, F0, L2
  [0, 36 + 0, 45 + 2], // 2: ULB -> U0, L0, B2
  [2, 45 + 0, 9 + 2], // 3: UBR -> U2, B0, R2
  [29, 18 + 8, 9 + 6], // 4: DFR -> D2, F8, R6
  [27, 36 + 8, 18 + 6], // 5: DLF -> D0, L8, F6
  [33, 45 + 8, 36 + 6], // 6: DBL -> D6, B8, L6
  [35, 9 + 8, 45 + 6], // 7: DRB -> D8, R8, B6
];

// Edge facelet positions: [primary facelet, secondary facelet]
const EDGE_FACELETS: [number, number][] = [
  [5, 9 + 1], // 0: UR -> U5, R1
  [7, 18 + 1], // 1: UF -> U7, F1
  [3, 36 + 1], // 2: UL -> U3, L1
  [1, 45 + 1], // 3: UB -> U1, B1
  [32, 9 + 7], // 4: DR -> D5, R7
  [28, 18 + 7], // 5: DF -> D1, F7
  [30, 36 + 7], // 6: DL -> D3, L7
  [34, 45 + 7], // 7: DB -> D7, B7
  [18 + 5, 9 + 3], // 8: FR -> F5, R3
  [18 + 3, 36 + 5], // 9: FL -> F3, L5
  [45 + 5, 36 + 3], // 10: BL -> B5, L3
  [45 + 3, 9 + 5], // 11: BR -> B3, R5
];

// Convert piece-based state to 54-facelet array
export function stateToFacelets(state: CubeState): FaceColor[] {
  const facelets = new Array<FaceColor>(54);

  // Centers (fixed)
  facelets[4] = 'W'; // U center
  facelets[13] = 'R'; // R center
  facelets[22] = 'G'; // F center
  facelets[31] = 'Y'; // D center
  facelets[40] = 'O'; // L center
  facelets[49] = 'B'; // B center

  // Corners
  for (let pos = 0; pos < 8; pos++) {
    const piece = state.cp[pos]!;
    const ori = state.co[pos]!;
    const colors = CORNER_COLORS[piece]!;
    const faceletPositions = CORNER_FACELETS[pos]!;

    facelets[faceletPositions[0]!] = colors[(3 - ori) % 3]!;
    facelets[faceletPositions[1]!] = colors[(4 - ori) % 3]!;
    facelets[faceletPositions[2]!] = colors[(5 - ori) % 3]!;
  }

  // Edges
  for (let pos = 0; pos < 12; pos++) {
    const piece = state.ep[pos]!;
    const ori = state.eo[pos]!;
    const colors = EDGE_COLORS[piece]!;
    const faceletPositions = EDGE_FACELETS[pos]!;

    facelets[faceletPositions[0]!] = ori === 0 ? colors[0]! : colors[1]!;
    facelets[faceletPositions[1]!] = ori === 0 ? colors[1]! : colors[0]!;
  }

  return facelets;
}

// Get face color for a specific facelet index
export function getFaceletColor(state: CubeState, index: number): FaceColor {
  return stateToFacelets(state)[index]!;
}
