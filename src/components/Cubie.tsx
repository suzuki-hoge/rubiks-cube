import { useMemo } from 'react';
import * as THREE from 'three';
import { FACE_COLORS, CUBE_BODY_COLOR } from '../cube/colors';
import type { FaceColor } from '../types';

interface CubieProps {
  position: [number, number, number];
  colors: Record<string, FaceColor | null>; // { px, nx, py, ny, pz, nz }
  dimmed?: boolean;
  highlightedFace?: string | null; // e.g. "py", "nx" — only that face glows
}

const CUBIE_SIZE = 0.97;

function lightenColor(hex: string, amount: number): string {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r + amount);
  c.g = Math.min(1, c.g + amount);
  c.b = Math.min(1, c.b + amount);
  return '#' + c.getHexString();
}

export function Cubie({ position, colors, dimmed, highlightedFace }: CubieProps) {
  const materials = useMemo(() => {
    const sides = ['px', 'nx', 'py', 'ny', 'pz', 'nz'] as const;
    return sides.map((side) => {
      const faceColor = colors[side];
      const baseColor = faceColor ? FACE_COLORS[faceColor] : CUBE_BODY_COLOR;
      const isHighlighted = highlightedFace === side && faceColor != null;
      const highlightEmissive =
        faceColor === 'W'
          ? new THREE.Color('#888888')
          : new THREE.Color(lightenColor(baseColor, 0.3));

      // Dim non-highlighted pieces: wash out toward light gray
      const color = dimmed
        ? new THREE.Color(baseColor).lerp(new THREE.Color('#aaaaaa'), 0.8)
        : new THREE.Color(baseColor);

      return new THREE.MeshStandardMaterial({
        color,
        emissive: isHighlighted ? highlightEmissive : new THREE.Color(0x000000),
        emissiveIntensity: isHighlighted ? 0.5 : 0,
        roughness: faceColor ? 0.3 : 0.8,
        metalness: 0.0,
      });
    });
  }, [colors, dimmed, highlightedFace]);

  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
  }, []);

  return (
    <group position={position}>
      <mesh geometry={geometry} material={materials} castShadow receiveShadow />
    </group>
  );
}
