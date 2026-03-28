import { useCallback, useRef } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Move } from '../types';

interface SwipeStart {
  point: THREE.Vector3;
  screenX: number;
  screenY: number;
  faceNormal: THREE.Vector3;
  cubiePosition: THREE.Vector3;
}

// Determine which face was hit based on the face normal
function classifyFace(normal: THREE.Vector3): 'U' | 'D' | 'F' | 'B' | 'R' | 'L' | null {
  const abs = new THREE.Vector3(Math.abs(normal.x), Math.abs(normal.y), Math.abs(normal.z));
  if (abs.y > abs.x && abs.y > abs.z) return normal.y > 0 ? 'U' : 'D';
  if (abs.x > abs.y && abs.x > abs.z) return normal.x > 0 ? 'R' : 'L';
  if (abs.z > abs.y && abs.z > abs.x) return normal.z > 0 ? 'F' : 'B';
  return null;
}

export function useSwipeDetection(
  onMove: (move: Move) => void,
  onHighlight: (face: string | null, layer: number | null) => void,
  minDistance: number,
) {
  const swipeStart = useRef<SwipeStart | null>(null);

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const intersection = e.intersections[0];
      if (!intersection?.face) return;

      const normal = intersection.face.normal.clone();
      // Transform normal to world space
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

      // Determine which layer to highlight
      const rX = Math.round(cubiePos.x);
      const rY = Math.round(cubiePos.y);

      if (face === 'U' || face === 'D') {
        onHighlight(face, null);
      } else if (face === 'R' || face === 'L') {
        onHighlight(face, rY);
      } else {
        onHighlight(face, rX);
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
      const move = resolveMove(face, roundedX, roundedY, roundedZ, isHorizontal, dx, dy);
      if (move) {
        onMove(move);
      }
    },
    [onMove, onHighlight, minDistance],
  );

  return { handlePointerDown, handlePointerUp };
}

function resolveMove(
  face: string,
  x: number,
  y: number,
  z: number,
  isHorizontal: boolean,
  dx: number,
  dy: number,
): Move | null {
  // U face: horizontal swipe = row rotation, vertical swipe = column rotation
  if (face === 'U') {
    if (isHorizontal) {
      // Row based on z position (z=1 is front/row3, z=-1 is back/row1)
      if (z === -1) return dx > 0 ? "U'" : 'U'; // back row → U layer
      if (z === 0) return dx > 0 ? "y'" : 'y'; // center → rotation
      if (z === 1) return dx > 0 ? 'D' : "D'"; // front row → D layer (inverted because viewing from top)
    } else {
      // Column based on x position
      if (x === -1) return dy > 0 ? 'L' : "L'"; // left column
      if (x === 0) return dy > 0 ? 'x' : "x'"; // center → rotation
      if (x === 1) return dy > 0 ? "R'" : 'R'; // right column
    }
  }

  // R face: vertical swipe = layer rotation
  if (face === 'R') {
    if (!isHorizontal) {
      // Column based on z position (z=1 is front, z=-1 is back)
      if (z === 1) return dy > 0 ? 'F' : "F'";
      if (z === 0) return dy > 0 ? 'x' : "x'"; // center → rotation
      if (z === -1) return dy > 0 ? "B'" : 'B';
    } else {
      // Horizontal swipe on R face → y rotation or U/D
      if (y === 1) return dx > 0 ? "U'" : 'U';
      if (y === 0) return dx > 0 ? "y'" : 'y';
      if (y === -1) return dx > 0 ? 'D' : "D'";
    }
  }

  // F face: similar logic
  if (face === 'F') {
    if (!isHorizontal) {
      if (x === 1) return dy > 0 ? "R'" : 'R';
      if (x === 0) return dy > 0 ? 'x' : "x'";
      if (x === -1) return dy > 0 ? 'L' : "L'";
    } else {
      if (y === 1) return dx > 0 ? "U'" : 'U';
      if (y === 0) return dx > 0 ? "y'" : 'y';
      if (y === -1) return dx > 0 ? 'D' : "D'";
    }
  }

  return null;
}
