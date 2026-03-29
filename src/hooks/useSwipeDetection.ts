import { useCallback, useEffect, useRef } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { FaceName, Move } from '../types';

interface SwipeStart {
  point: THREE.Vector3;
  screenX: number;
  screenY: number;
  faceNormal: THREE.Vector3;
  cubiePosition: THREE.Vector3;
}

// Determine which face was hit based on the face normal
function classifyFace(normal: THREE.Vector3): FaceName | null {
  const abs = new THREE.Vector3(Math.abs(normal.x), Math.abs(normal.y), Math.abs(normal.z));
  if (abs.y > abs.x && abs.y > abs.z) return normal.y > 0 ? 'U' : 'D';
  if (abs.x > abs.y && abs.x > abs.z) return normal.x > 0 ? 'R' : 'L';
  if (abs.z > abs.y && abs.z > abs.x) return normal.z > 0 ? 'F' : 'B';
  return null;
}

const FACE_TO_DIR: Record<FaceName, string> = {
  U: 'py',
  D: 'ny',
  R: 'px',
  L: 'nx',
  F: 'pz',
  B: 'nz',
};

export function useSwipeDetection(
  onMove: (move: Move) => void,
  onHighlight: (cubieKey: string | null, faceDir: string | null) => void,
  minDistance: number,
  frontFace: FaceName,
) {
  const swipeStart = useRef<SwipeStart | null>(null);

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const intersection = e.intersections[0];
      if (!intersection?.face) return;

      const normal = intersection.face.normal.clone();
      const obj = intersection.object;
      normal.applyQuaternion(obj.getWorldQuaternion(new THREE.Quaternion()));

      const face = classifyFace(normal);
      if (!face) return;

      const worldPoint = intersection.point.clone();
      const cubiePos = new THREE.Vector3();
      obj.parent?.getWorldPosition(cubiePos);

      swipeStart.current = {
        point: worldPoint,
        screenX: e.nativeEvent.clientX,
        screenY: e.nativeEvent.clientY,
        faceNormal: normal,
        cubiePosition: cubiePos,
      };

      // Only highlight faces with actual color (not body/gap faces)
      const rX = Math.round(cubiePos.x);
      const rY = Math.round(cubiePos.y);
      const rZ = Math.round(cubiePos.z);
      const isFaceColored = isCubieFaceColored(rX, rY, rZ, face);
      if (isFaceColored) {
        onHighlight(`${rX},${rY},${rZ}`, FACE_TO_DIR[face]);
      }
    },
    [onHighlight],
  );

  const handlePointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const start = swipeStart.current;
      if (!start) return;
      swipeStart.current = null;
      onHighlight(null, null);

      const dx = e.nativeEvent.clientX - start.screenX;
      const dy = e.nativeEvent.clientY - start.screenY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDistance) return;

      const face = classifyFace(start.faceNormal);
      if (!face) return;

      const cubiePos = start.cubiePosition;
      const roundedX = Math.round(cubiePos.x);
      const roundedY = Math.round(cubiePos.y);
      const roundedZ = Math.round(cubiePos.z);

      const isHorizontal = Math.abs(dx) > Math.abs(dy);
      const move = resolveMove(face, roundedX, roundedY, roundedZ, isHorizontal, dx, dy, frontFace);
      if (move) {
        onMove(move);
      }
    },
    [onMove, onHighlight, minDistance, frontFace],
  );

  const handlePointerCancel = useCallback(() => {
    if (swipeStart.current) {
      swipeStart.current = null;
      onHighlight(null, null);
    }
  }, [onHighlight]);

  // Global pointerup to clear highlight when pointer released outside the cube.
  // Use setTimeout so R3F's onPointerUp fires first to process the swipe.
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setTimeout(() => {
        if (swipeStart.current) {
          swipeStart.current = null;
          onHighlight(null, null);
        }
      }, 0);
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, [onHighlight]);

  return { handlePointerDown, handlePointerUp, handlePointerCancel };
}

// Check if a cubie face at a given position would have a sticker color (not body)
function isCubieFaceColored(x: number, y: number, z: number, face: FaceName): boolean {
  switch (face) {
    case 'U': return y === 1;
    case 'D': return y === -1;
    case 'R': return x === 1;
    case 'L': return x === -1;
    case 'F': return z === 1;
    case 'B': return z === -1;
    default: return false;
  }
}

function resolveMove(
  face: FaceName,
  x: number,
  y: number,
  z: number,
  isHorizontal: boolean,
  dx: number,
  dy: number,
  frontFace: FaceName,
): Move | null {
  // U face: horizontal swipe = row rotation, vertical swipe = column rotation
  if (face === 'U') {
    if (isHorizontal) {
      if (z === -1) return dx > 0 ? "U'" : 'U';
      if (z === 0) return face === frontFace ? (dx > 0 ? "y'" : 'y') : null;
      if (z === 1) return dx > 0 ? 'D' : "D'";
    } else {
      if (x === -1) return dy > 0 ? 'L' : "L'";
      if (x === 0) return face === frontFace ? (dy > 0 ? "x'" : 'x') : null;
      if (x === 1) return dy > 0 ? "R'" : 'R';
    }
  }

  // R face: vertical swipe = layer rotation
  if (face === 'R') {
    if (!isHorizontal) {
      if (z === 1) return dy > 0 ? 'F' : "F'";
      if (z === 0) return face === frontFace ? (dy > 0 ? "x'" : 'x') : null;
      if (z === -1) return dy > 0 ? "B'" : 'B';
    } else {
      if (y === 1) return dx > 0 ? "U'" : 'U';
      if (y === 0) return face === frontFace ? (dx > 0 ? "y'" : 'y') : null;
      if (y === -1) return dx > 0 ? 'D' : "D'";
    }
  }

  // F face
  if (face === 'F') {
    if (!isHorizontal) {
      if (x === 1) return dy > 0 ? "R'" : 'R';
      if (x === 0) return face === frontFace ? (dy > 0 ? "x'" : 'x') : null;
      if (x === -1) return dy > 0 ? 'L' : "L'";
    } else {
      if (y === 1) return dx > 0 ? "U'" : 'U';
      if (y === 0) return face === frontFace ? (dx > 0 ? "y'" : 'y') : null;
      if (y === -1) return dx > 0 ? 'D' : "D'";
    }
  }

  return null;
}
