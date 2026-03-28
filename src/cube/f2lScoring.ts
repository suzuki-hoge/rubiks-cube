import type { CubeState, F2LSlot, F2LScore, Settings, CornerPiece, EdgePiece } from '../types';

// F2L slots: corner piece + edge piece for each slot
// Slots defined with white on bottom (after cross solved, U=white in our convention but
// typically we'd hold white on bottom. For standard orientation with white on top:
// The F2L happens in the D layer. But in our model U=white, so F2L slots are the U-layer corners
// paired with middle-layer edges.
//
// Actually: white cross = 4 white edges solved at U positions (UR, UF, UL, UB).
// F2L pairs are the 4 corner-edge pairs that go in the slots between the cross edges.
// Corner: URF(0), UFL(1), ULB(2), UBR(3) — these are the U-layer corners
// Edge: FR(8), FL(9), BL(10), BR(11) — these are the middle-layer edges

export const F2L_SLOTS: F2LSlot[] = [
  { name: 'RF', cornerPiece: 0 as CornerPiece, edgePiece: 8 as EdgePiece, isBackSlot: false },
  { name: 'LF', cornerPiece: 1 as CornerPiece, edgePiece: 9 as EdgePiece, isBackSlot: false },
  { name: 'LB', cornerPiece: 2 as CornerPiece, edgePiece: 10 as EdgePiece, isBackSlot: true },
  { name: 'RB', cornerPiece: 3 as CornerPiece, edgePiece: 11 as EdgePiece, isBackSlot: true },
];

// Which facelets of each corner position are visible from the standard viewpoint
// (U face, F face, R face visible)
// Corner positions: URF=0, UFL=1, ULB=2, UBR=3, DFR=4, DLF=5, DBL=6, DRB=7
// Each corner has 3 facelets. How many are visible from U+F+R viewpoint?
function cornerVisibleFaceCount(position: number): number {
  switch (position) {
    case 0:
      return 3; // URF: U, R, F all visible
    case 1:
      return 2; // UFL: U, F visible (L not visible)
    case 2:
      return 1; // ULB: U visible (L, B not visible)
    case 3:
      return 2; // UBR: U, R visible (B not visible)
    case 4:
      return 2; // DFR: F, R visible (D not visible)
    case 5:
      return 1; // DLF: F visible (D, L not visible)
    case 6:
      return 0; // DBL: none visible (D, B, L)
    case 7:
      return 1; // DRB: R visible (D, B not visible)
    default:
      return 0;
  }
}

// Is corner visible (2+ colors visible)?
function isCornerVisible(state: CubeState, cornerPiece: CornerPiece): boolean {
  const position = state.cp.indexOf(cornerPiece);
  return cornerVisibleFaceCount(position) >= 2;
}

// Edge visibility: is the edge at a position where at least one face is on U/F/R?
// Edge positions and their faces:
// 0:UR(U,R), 1:UF(U,F), 2:UL(U,L), 3:UB(U,B)
// 4:DR(D,R), 5:DF(D,F), 6:DL(D,L), 7:DB(D,B)
// 8:FR(F,R), 9:FL(F,L), 10:BL(B,L), 11:BR(B,R)
function isEdgePositionVisible(position: number): boolean {
  // Visible if at least one face is U, F, or R
  switch (position) {
    case 0:
      return true; // UR: U+R
    case 1:
      return true; // UF: U+F
    case 2:
      return true; // UL: U (L not visible but U is)
    case 3:
      return true; // UB: U (B not visible but U is)
    case 4:
      return true; // DR: R
    case 5:
      return true; // DF: F
    case 6:
      return false; // DL: D+L, neither visible
    case 7:
      return false; // DB: D+B, neither visible
    case 8:
      return true; // FR: F+R
    case 9:
      return true; // FL: F (partially)
    case 10:
      return false; // BL: B+L, neither visible
    case 11:
      return true; // BR: R (partially)
    default:
      return false;
  }
}

function isEdgeVisible(state: CubeState, edgePiece: EdgePiece, _allF2lEdges: EdgePiece[]): boolean {
  const position = state.ep.indexOf(edgePiece);
  if (isEdgePositionVisible(position)) return true;

  // Elimination rule: if all other 3 F2L edges are visible, this one is deducible
  const otherEdges = _allF2lEdges.filter((e) => e !== edgePiece);
  const othersAllVisible = otherEdges.every((e) => {
    const pos = state.ep.indexOf(e);
    return isEdgePositionVisible(pos);
  });
  return othersAllVisible;
}

export function scoreF2LPairs(state: CubeState, settings: Settings): F2LScore[] {
  const allF2lEdges = F2L_SLOTS.map((s) => s.edgePiece);

  return F2L_SLOTS.map((slot) => {
    // Edge Orientation check: is the edge at its home position with correct orientation?
    const edgePos = state.ep.indexOf(slot.edgePiece);
    const eoGood = state.eo[edgePos] === 0;

    const cornerVisible = isCornerVisible(state, slot.cornerPiece);
    const edgeVisible = isEdgeVisible(state, slot.edgePiece, allF2lEdges);

    let score = 0;
    if (eoGood) score += settings.f2l.eoBonus;
    if (slot.isBackSlot) score += settings.f2l.backSlotBonus;

    if (cornerVisible && edgeVisible) {
      score += settings.f2l.visibilityBothBonus;
    } else if (cornerVisible) {
      score += settings.f2l.visibilityCornerOnlyBonus;
    } else if (edgeVisible) {
      score += settings.f2l.visibilityEdgeOnlyBonus;
    }

    return { slot, score, eoGood, cornerVisible, edgeVisible };
  }).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-break: slot order RF→LF→LB→RB
    return F2L_SLOTS.indexOf(a.slot) - F2L_SLOTS.indexOf(b.slot);
  });
}
