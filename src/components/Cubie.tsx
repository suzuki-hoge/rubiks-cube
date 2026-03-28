import { useMemo } from 'react';
import * as THREE from 'three';
import { FACE_COLORS, CUBE_BODY_COLOR } from '../cube/colors';
import type { FaceColor } from '../types';

interface CubieProps {
  position: [number, number, number];
  colors: Record<string, FaceColor | null>; // { px, nx, py, ny, pz, nz }
  glowing?: boolean;
  highlightedFace?: string | null; // e.g. "py", "nx" — only that face glows
}

const CUBIE_SIZE = 0.93;

export function Cubie({ position, colors, glowing, highlightedFace }: CubieProps) {
  const materials = useMemo(() => {
    const sides = ['px', 'nx', 'py', 'ny', 'pz', 'nz'] as const;
    return sides.map((side) => {
      const faceColor = colors[side];
      const color = faceColor ? FACE_COLORS[faceColor] : CUBE_BODY_COLOR;
      const isHighlighted = highlightedFace === side;
      return new THREE.MeshLambertMaterial({
        color,
        emissive:
          (glowing && faceColor) || isHighlighted
            ? new THREE.Color(isHighlighted ? '#ffffff' : color)
            : new THREE.Color(0x000000),
        emissiveIntensity: isHighlighted ? 0.6 : glowing ? 0.5 : 0,
      });
    });
  }, [colors, glowing, highlightedFace]);

  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE).translate(0, 0, 0);
  }, []);

  return (
    <group position={position}>
      <mesh geometry={geometry} material={materials} castShadow receiveShadow />
    </group>
  );
}
