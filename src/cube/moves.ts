import type {
  CubeState,
  MoveDefinition,
  Move,
  CornerPiece,
  EdgePiece,
  CornerOrientation,
  EdgeOrientation,
} from '../types';
import { cloneState } from './pieces';

// Each move definition specifies where pieces go:
// cp[i] = the piece that was at position cp[i] moves to position i
// co[i] = orientation change for the piece arriving at position i

const MOVES: Record<string, MoveDefinition> = {
  // U move (CW from above): UBR->URF->UFL->ULB->UBR, UB->UR->UF->UL->UB
  U: {
    cp: [3, 0, 1, 2, 4, 5, 6, 7] as CornerPiece[],
    co: [0, 0, 0, 0, 0, 0, 0, 0] as CornerOrientation[],
    ep: [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11] as EdgePiece[],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as EdgeOrientation[],
  },
  // D move (CW from below): DFR->DRB->DBL->DLF->DFR, DR->DB->DL->DF->DR
  D: {
    cp: [0, 1, 2, 3, 5, 6, 7, 4] as CornerPiece[],
    co: [0, 0, 0, 0, 0, 0, 0, 0] as CornerOrientation[],
    ep: [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11] as EdgePiece[],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as EdgeOrientation[],
  },
  // R move: URF->DFR->DRB->UBR->URF, UR->FR->DR->BR->UR
  R: {
    cp: [4, 1, 2, 0, 7, 5, 6, 3] as CornerPiece[],
    co: [2, 0, 0, 1, 1, 0, 0, 2] as CornerOrientation[],
    ep: [8, 1, 2, 3, 11, 5, 6, 7, 4, 9, 10, 0] as EdgePiece[],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as EdgeOrientation[],
  },
  // L move: UFL->ULB->DBL->DLF->UFL, UL->BL->DL->FL->UL
  L: {
    cp: [0, 2, 6, 3, 4, 1, 5, 7] as CornerPiece[],
    co: [0, 1, 2, 0, 0, 2, 1, 0] as CornerOrientation[],
    ep: [0, 1, 10, 3, 4, 5, 9, 7, 8, 2, 6, 11] as EdgePiece[],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as EdgeOrientation[],
  },
  // F move: URF->UFL->DLF->DFR->URF, UF->FL->DF->FR->UF
  F: {
    cp: [1, 5, 2, 3, 0, 4, 6, 7] as CornerPiece[],
    co: [1, 2, 0, 0, 2, 1, 0, 0] as CornerOrientation[],
    ep: [0, 9, 2, 3, 4, 8, 6, 7, 1, 5, 10, 11] as EdgePiece[],
    eo: [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0] as EdgeOrientation[],
  },
  // B move: UBR->ULB->DBL->DRB->UBR (note direction!), UB->BR->DB->BL->UB
  B: {
    cp: [0, 1, 3, 7, 4, 5, 2, 6] as CornerPiece[],
    co: [0, 0, 1, 2, 0, 0, 2, 1] as CornerOrientation[],
    ep: [0, 1, 2, 11, 4, 5, 6, 10, 8, 9, 3, 7] as EdgePiece[],
    eo: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1] as EdgeOrientation[],
  },
};

// Rotation definitions (whole cube rotations)
const ROTATIONS: Record<string, MoveDefinition> = {
  // x = R-rotation of whole cube (R + L' direction)
  x: {
    cp: [3, 2, 6, 7, 0, 1, 5, 4] as CornerPiece[],
    co: [2, 1, 2, 1, 1, 2, 1, 2] as CornerOrientation[],
    ep: [11, 3, 10, 7, 8, 1, 9, 5, 0, 2, 6, 4] as EdgePiece[],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as EdgeOrientation[],
  },
  // y = U-rotation of whole cube (CW from above)
  y: {
    cp: [3, 0, 1, 2, 7, 4, 5, 6] as CornerPiece[],
    co: [0, 0, 0, 0, 0, 0, 0, 0] as CornerOrientation[],
    ep: [3, 0, 1, 2, 7, 4, 5, 6, 11, 8, 9, 10] as EdgePiece[],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1] as EdgeOrientation[],
  },
  // z = F-rotation of whole cube
  z: {
    cp: [1, 5, 6, 2, 0, 4, 7, 3] as CornerPiece[],
    co: [1, 2, 1, 2, 2, 1, 2, 1] as CornerOrientation[],
    ep: [2, 9, 6, 10, 0, 8, 4, 11, 1, 5, 7, 3] as EdgePiece[],
    eo: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] as EdgeOrientation[],
  },
};

function applyMoveDefinition(state: CubeState, def: MoveDefinition): CubeState {
  const result = cloneState(state);
  for (let i = 0; i < 8; i++) {
    const src = def.cp[i]!;
    result.cp[i] = state.cp[src]!;
    result.co[i] = ((state.co[src]! + def.co[i]!) % 3) as CornerOrientation;
  }
  for (let i = 0; i < 12; i++) {
    const src = def.ep[i]!;
    result.ep[i] = state.ep[src]!;
    result.eo[i] = ((state.eo[src]! + def.eo[i]!) % 2) as EdgeOrientation;
  }
  return result;
}

function invertDefinition(def: MoveDefinition): MoveDefinition {
  const cp = new Array(8) as CornerPiece[];
  const co = new Array(8) as CornerOrientation[];
  const ep = new Array(12) as EdgePiece[];
  const eo = new Array(12) as EdgeOrientation[];

  for (let i = 0; i < 8; i++) {
    const j = def.cp[i]!;
    cp[j] = i as CornerPiece;
    co[j] = ((3 - def.co[i]!) % 3) as CornerOrientation;
  }
  for (let i = 0; i < 12; i++) {
    const j = def.ep[i]!;
    ep[j] = i as EdgePiece;
    eo[j] = def.eo[i]!; // XOR inverse is same for mod 2
  }
  return { cp, co, ep, eo };
}

function composeDefinitions(a: MoveDefinition, b: MoveDefinition): MoveDefinition {
  const cp = new Array(8) as CornerPiece[];
  const co = new Array(8) as CornerOrientation[];
  const ep = new Array(12) as EdgePiece[];
  const eo = new Array(12) as EdgeOrientation[];

  for (let i = 0; i < 8; i++) {
    const src = b.cp[i]!;
    cp[i] = a.cp[src]!;
    co[i] = ((a.co[src]! + b.co[i]!) % 3) as CornerOrientation;
  }
  for (let i = 0; i < 12; i++) {
    const src = b.ep[i]!;
    ep[i] = a.ep[src]!;
    eo[i] = ((a.eo[src]! + b.eo[i]!) % 2) as EdgeOrientation;
  }
  return { cp, co, ep, eo };
}

// Build all 27 move definitions
function buildAllMoves(): Record<Move, MoveDefinition> {
  const result: Partial<Record<Move, MoveDefinition>> = {};

  // Face moves
  for (const face of ['U', 'D', 'R', 'L', 'F', 'B'] as const) {
    const def = MOVES[face]!;
    result[face] = def;
    result[`${face}'` as Move] = invertDefinition(def);
    result[`${face}2` as Move] = composeDefinitions(def, def);
  }

  // Rotations
  for (const rot of ['x', 'y', 'z'] as const) {
    const def = ROTATIONS[rot]!;
    result[rot] = def;
    result[`${rot}'` as Move] = invertDefinition(def);
    result[`${rot}2` as Move] = composeDefinitions(def, def);
  }

  return result as Record<Move, MoveDefinition>;
}

const ALL_MOVES = buildAllMoves();

export function applyMove(state: CubeState, move: Move): CubeState {
  return applyMoveDefinition(state, ALL_MOVES[move]);
}

export function applyMoves(state: CubeState, moves: Move[]): CubeState {
  let s = state;
  for (const m of moves) {
    s = applyMove(s, m);
  }
  return s;
}

export function parseMove(s: string): Move | null {
  const trimmed = s.trim();
  const valid: Move[] = [
    'U',
    "U'",
    'U2',
    'D',
    "D'",
    'D2',
    'R',
    "R'",
    'R2',
    'L',
    "L'",
    'L2',
    'F',
    "F'",
    'F2',
    'B',
    "B'",
    'B2',
    'x',
    "x'",
    'x2',
    'y',
    "y'",
    'y2',
    'z',
    "z'",
    'z2',
  ];
  return valid.includes(trimmed as Move) ? (trimmed as Move) : null;
}

export function parseMoveSequence(s: string): Move[] {
  return s
    .split(/\s+/)
    .map(parseMove)
    .filter((m): m is Move => m !== null);
}

export function inverseMoveSequence(moves: Move[]): Move[] {
  return moves
    .slice()
    .reverse()
    .map((m) => {
      if (m.endsWith('2')) return m;
      if (m.endsWith("'")) return m.slice(0, -1) as Move;
      return `${m}'` as Move;
    });
}
