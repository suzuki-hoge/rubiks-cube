// Corner positions (solved state positions)
// U-layer: URF=0, UFL=1, ULB=2, UBR=3
// D-layer: DFR=4, DLF=5, DBL=6, DRB=7
export type CornerPiece = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type CornerOrientation = 0 | 1 | 2; // 0=correct, 1=CW twist, 2=CCW twist

// Edge positions (solved state positions)
// U-layer: UR=0, UF=1, UL=2, UB=3
// D-layer: DR=4, DF=5, DL=6, DB=7
// Middle: FR=8, FL=9, BL=10, BR=11
export type EdgePiece = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export type EdgeOrientation = 0 | 1; // 0=correct, 1=flipped

export interface CubeState {
  cp: CornerPiece[]; // corner permutation, length 8
  co: CornerOrientation[]; // corner orientation, length 8
  ep: EdgePiece[]; // edge permutation, length 12
  eo: EdgeOrientation[]; // edge orientation, length 12
}

export type FaceColor = 'W' | 'Y' | 'R' | 'O' | 'B' | 'G';
export type FaceName = 'U' | 'D' | 'F' | 'B' | 'R' | 'L';

export type Move =
  | 'U'
  | "U'"
  | 'U2'
  | 'D'
  | "D'"
  | 'D2'
  | 'R'
  | "R'"
  | 'R2'
  | 'L'
  | "L'"
  | 'L2'
  | 'F'
  | "F'"
  | 'F2'
  | 'B'
  | "B'"
  | 'B2'
  | 'x'
  | "x'"
  | 'x2'
  | 'y'
  | "y'"
  | 'y2'
  | 'z'
  | "z'"
  | 'z2';

export interface MoveDefinition {
  cp: CornerPiece[];
  co: CornerOrientation[];
  ep: EdgePiece[];
  eo: EdgeOrientation[];
}

export interface Settings {
  gyro: {
    sensitivity: number;
    maxAngle: number;
  };
  swipe: {
    minDistance: number;
    animationDuration: number;
  };
  f2l: {
    eoBonus: number;
    backSlotBonus: number;
    visibilityBothBonus: number;
    visibilityCornerOnlyBonus: number;
    visibilityEdgeOnlyBonus: number;
  };
}

export interface F2LSlot {
  name: string;
  cornerPiece: CornerPiece;
  edgePiece: EdgePiece;
  isBackSlot: boolean;
}

export interface F2LScore {
  slot: F2LSlot;
  score: number;
  eoGood: boolean;
  cornerVisible: boolean;
  edgeVisible: boolean;
}
