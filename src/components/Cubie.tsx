import { useMemo } from 'react';
import * as THREE from 'three';
import { FACE_COLORS, CUBE_BODY_COLOR } from '../cube/colors';
import type { FaceColor } from '../types';

interface CubieProps {
  position: [number, number, number];
  colors: Record<string, FaceColor | null>; // { px, nx, py, ny, pz, nz }
  glowing?: boolean;
  highlighted?: boolean;
}

const CUBIE_SIZE = 0.93;

export function Cubie({ position, colors, glowing, highlighted }: CubieProps) {
  const materials = useMemo(() => {
    const sides = ['px', 'nx', 'py', 'ny', 'pz', 'nz'] as const;
    return sides.map((side) => {
      const faceColor = colors[side];
      const color = faceColor ? FACE_COLORS[faceColor] : CUBE_BODY_COLOR;
      return new THREE.MeshLambertMaterial({
        color,
        emissive: glowing && faceColor ? new THREE.Color(color) : new THREE.Color(0x000000),
        emissiveIntensity: glowing ? 0.5 : 0,
      });
    });
  }, [colors, glowing]);

  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE).translate(0, 0, 0);
  }, []);

  return (
    <group position={position}>
      <mesh geometry={geometry} material={materials} castShadow receiveShadow>
        {highlighted && (
          <meshStandardMaterial
            attach="material"
            color="#ffffff"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>
    </group>
  );
}
