import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Cubie } from './Cubie';
import { stateToFacelets } from '../cube/convert';
import type { CubeState, FaceColor, Move } from '../types';

interface CubeGroupProps {
  cubeState: CubeState;
  centers: FaceColor[];
  animatingMove: Move | null;
  animationDuration: number;
  onAnimationComplete: () => void;
  glowingPieces: Set<string>;
  highlightedCubie: string | null;
  highlightedFace: string | null;
}

// Map from 3D position to cubie identity for glow matching
function cubieKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}

// Build cubie data from facelet array
interface CubieData {
  position: [number, number, number];
  colors: Record<string, FaceColor | null>;
  key: string;
}

function buildCubies(facelets: FaceColor[]): CubieData[] {
  // Each cubie at position (x, y, z) where x,y,z ∈ {-1, 0, 1}
  // We need to assign the correct facelet colors to each cubie face
  const cubies: CubieData[] = [];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue; // skip center

        const colors: Record<string, FaceColor | null> = {
          px: null,
          nx: null,
          py: null,
          ny: null,
          pz: null,
          nz: null,
        };

        // U face (y=1): facelet row maps to z (z=-1 is row0=back, z=1 is row2=front)
        // col maps to x (x=-1 is col0, x=1 is col2)
        if (y === 1) {
          const row = z + 1; // z=-1->row0(back), z=0->row1, z=1->row2(front)
          const col = x + 1;
          colors.py = facelets[row * 3 + col] ?? null;
        }
        // D face (y=-1): facelet row maps to z (z=1 is row0=front, z=-1 is row2=back)
        if (y === -1) {
          const row = 1 - z; // z=1->row0(front), z=0->row1, z=-1->row2(back)
          const col = x + 1;
          colors.ny = facelets[27 + row * 3 + col] ?? null;
        }
        // R face (x=1): col maps to z (z=1 is col0, z=-1 is col2)
        if (x === 1) {
          const row = 1 - y; // y=1->row0, y=-1->row2
          const col = 1 - z; // z=1->col0, z=-1->col2
          colors.px = facelets[9 + row * 3 + col] ?? null;
        }
        // L face (x=-1): col maps to z (z=-1 is col0, z=1 is col2)
        if (x === -1) {
          const row = 1 - y;
          const col = z + 1; // z=-1->col0, z=1->col2
          colors.nx = facelets[36 + row * 3 + col] ?? null;
        }
        // F face (z=1): col maps to x (x=-1 is col0)
        if (z === 1) {
          const row = 1 - y;
          const col = x + 1;
          colors.pz = facelets[18 + row * 3 + col] ?? null;
        }
        // B face (z=-1): col maps to x (x=1 is col0, mirrored)
        if (z === -1) {
          const row = 1 - y;
          const col = 1 - x; // x=1->col0, x=-1->col2
          colors.nz = facelets[45 + row * 3 + col] ?? null;
        }

        cubies.push({
          position: [x, y, z],
          colors,
          key: cubieKey(x, y, z),
        });
      }
    }
  }
  return cubies;
}

// Determine which cubies are affected by a move and the rotation axis/angle
function getMoveRotation(move: Move): {
  axis: THREE.Vector3;
  angle: number;
  filter: (pos: [number, number, number]) => boolean;
} | null {
  const configs: Record<
    string,
    {
      axis: [number, number, number];
      angle: number;
      filter: (pos: [number, number, number]) => boolean;
    }
  > = {
    U: { axis: [0, 1, 0], angle: -Math.PI / 2, filter: (p) => p[1] === 1 },
    "U'": { axis: [0, 1, 0], angle: Math.PI / 2, filter: (p) => p[1] === 1 },
    U2: { axis: [0, 1, 0], angle: -Math.PI, filter: (p) => p[1] === 1 },
    D: { axis: [0, 1, 0], angle: Math.PI / 2, filter: (p) => p[1] === -1 },
    "D'": { axis: [0, 1, 0], angle: -Math.PI / 2, filter: (p) => p[1] === -1 },
    D2: { axis: [0, 1, 0], angle: Math.PI, filter: (p) => p[1] === -1 },
    R: { axis: [1, 0, 0], angle: -Math.PI / 2, filter: (p) => p[0] === 1 },
    "R'": { axis: [1, 0, 0], angle: Math.PI / 2, filter: (p) => p[0] === 1 },
    R2: { axis: [1, 0, 0], angle: -Math.PI, filter: (p) => p[0] === 1 },
    L: { axis: [1, 0, 0], angle: Math.PI / 2, filter: (p) => p[0] === -1 },
    "L'": { axis: [1, 0, 0], angle: -Math.PI / 2, filter: (p) => p[0] === -1 },
    L2: { axis: [1, 0, 0], angle: Math.PI, filter: (p) => p[0] === -1 },
    F: { axis: [0, 0, 1], angle: -Math.PI / 2, filter: (p) => p[2] === 1 },
    "F'": { axis: [0, 0, 1], angle: Math.PI / 2, filter: (p) => p[2] === 1 },
    F2: { axis: [0, 0, 1], angle: -Math.PI, filter: (p) => p[2] === 1 },
    B: { axis: [0, 0, 1], angle: Math.PI / 2, filter: (p) => p[2] === -1 },
    "B'": { axis: [0, 0, 1], angle: -Math.PI / 2, filter: (p) => p[2] === -1 },
    B2: { axis: [0, 0, 1], angle: Math.PI, filter: (p) => p[2] === -1 },
    x: { axis: [1, 0, 0], angle: -Math.PI / 2, filter: () => true },
    "x'": { axis: [1, 0, 0], angle: Math.PI / 2, filter: () => true },
    x2: { axis: [1, 0, 0], angle: -Math.PI, filter: () => true },
    y: { axis: [0, 1, 0], angle: -Math.PI / 2, filter: () => true },
    "y'": { axis: [0, 1, 0], angle: Math.PI / 2, filter: () => true },
    y2: { axis: [0, 1, 0], angle: -Math.PI, filter: () => true },
    z: { axis: [0, 0, 1], angle: -Math.PI / 2, filter: () => true },
    "z'": { axis: [0, 0, 1], angle: Math.PI / 2, filter: () => true },
    z2: { axis: [0, 0, 1], angle: -Math.PI, filter: () => true },
  };
  const cfg = configs[move];
  if (!cfg) return null;
  return {
    axis: new THREE.Vector3(...cfg.axis),
    angle: cfg.angle,
    filter: cfg.filter,
  };
}

export function CubeGroup({
  cubeState,
  centers,
  animatingMove,
  animationDuration,
  onAnimationComplete,
  glowingPieces,
  highlightedCubie,
  highlightedFace,
}: CubeGroupProps) {
  const animGroupRef = useRef<THREE.Group>(null);
  const animProgress = useRef(0);
  const animConfig = useRef<{ axis: THREE.Vector3; angle: number } | null>(null);

  const facelets = useMemo(() => stateToFacelets(cubeState, centers), [cubeState, centers]);
  const cubies = useMemo(() => buildCubies(facelets), [facelets]);

  const moveRotation = useMemo(
    () => (animatingMove ? getMoveRotation(animatingMove) : null),
    [animatingMove],
  );

  // Reset animation when move changes
  useMemo(() => {
    animProgress.current = 0;
    if (moveRotation) {
      animConfig.current = { axis: moveRotation.axis, angle: moveRotation.angle };
    } else {
      animConfig.current = null;
    }
  }, [animatingMove, moveRotation]);

  useFrame((_, delta) => {
    if (!animConfig.current || !animGroupRef.current) return;

    const duration = animationDuration / 1000;
    animProgress.current += delta / duration;

    if (animProgress.current >= 1) {
      // Keep final rotation until React re-renders with updated state
      // (resetting to identity would cause a 1-frame flicker)
      animGroupRef.current.quaternion.setFromAxisAngle(
        animConfig.current.axis,
        animConfig.current.angle,
      );
      animProgress.current = 0;
      animConfig.current = null;
      onAnimationComplete();
      return;
    }

    const t = easeInOutCubic(animProgress.current);
    const angle = animConfig.current.angle * t;
    animGroupRef.current.quaternion.setFromAxisAngle(animConfig.current.axis, angle);
  });

  // Check if a cubie should glow (is part of an F2L pair being highlighted)
  function shouldGlow(x: number, y: number, z: number): boolean {
    if (glowingPieces.size === 0) return false;
    // Map position to piece type and index
    const absSum = Math.abs(x) + Math.abs(y) + Math.abs(z);
    if (absSum === 3) {
      // Corner: find which corner position this is
      const cornerIdx = getCornerIndex(x, y, z);
      if (cornerIdx !== null) {
        const piece = cubeState.cp[cornerIdx];
        if (piece !== undefined && glowingPieces.has(`corner-${piece}`)) return true;
      }
    } else if (absSum === 2 && (x === 0 || y === 0 || z === 0)) {
      // Edge: find which edge position this is
      const edgeIdx = getEdgeIndex(x, y, z);
      if (edgeIdx !== null) {
        const piece = cubeState.ep[edgeIdx];
        if (piece !== undefined && glowingPieces.has(`edge-${piece}`)) return true;
      }
    }
    return false;
  }

  const animatingFilter = moveRotation?.filter;

  return (
    <>
      {/* Non-animating cubies */}
      {cubies
        .filter((c) => !animatingFilter || !animatingFilter(c.position))
        .map((c) => (
          <Cubie
            key={c.key}
            position={c.position}
            colors={c.colors}
            glowing={shouldGlow(...c.position)}
            highlightedFace={highlightedCubie === c.key ? highlightedFace : null}
          />
        ))}
      {/* Animating cubies group */}
      <group ref={animGroupRef}>
        {cubies
          .filter((c) => animatingFilter?.(c.position))
          .map((c) => (
            <Cubie
              key={c.key}
              position={c.position}
              colors={c.colors}
              glowing={shouldGlow(...c.position)}
              highlightedFace={highlightedCubie === c.key ? highlightedFace : null}
            />
          ))}
      </group>
    </>
  );
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getCornerIndex(x: number, y: number, z: number): number | null {
  // URF=0, UFL=1, ULB=2, UBR=3, DFR=4, DLF=5, DBL=6, DRB=7
  if (y === 1) {
    if (x === 1 && z === 1) return 0; // URF
    if (x === -1 && z === 1) return 1; // UFL
    if (x === -1 && z === -1) return 2; // ULB
    if (x === 1 && z === -1) return 3; // UBR
  } else if (y === -1) {
    if (x === 1 && z === 1) return 4; // DFR
    if (x === -1 && z === 1) return 5; // DLF
    if (x === -1 && z === -1) return 6; // DBL
    if (x === 1 && z === -1) return 7; // DRB
  }
  return null;
}

function getEdgeIndex(x: number, y: number, z: number): number | null {
  // UR=0, UF=1, UL=2, UB=3, DR=4, DF=5, DL=6, DB=7, FR=8, FL=9, BL=10, BR=11
  if (y === 1) {
    if (x === 1 && z === 0) return 0; // UR
    if (x === 0 && z === 1) return 1; // UF
    if (x === -1 && z === 0) return 2; // UL
    if (x === 0 && z === -1) return 3; // UB
  } else if (y === -1) {
    if (x === 1 && z === 0) return 4; // DR
    if (x === 0 && z === 1) return 5; // DF
    if (x === -1 && z === 0) return 6; // DL
    if (x === 0 && z === -1) return 7; // DB
  } else if (y === 0) {
    if (x === 1 && z === 1) return 8; // FR (note: F=+z, R=+x)
    if (x === -1 && z === 1) return 9; // FL
    if (x === -1 && z === -1) return 10; // BL
    if (x === 1 && z === -1) return 11; // BR
  }
  return null;
}
