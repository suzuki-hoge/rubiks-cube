import { Canvas } from '@react-three/fiber';
import { CubeGroup } from './CubeGroup';
import type { CubeState, FaceColor, FaceName, Move } from '../types';
import { useSwipeDetection } from '../hooks/useSwipeDetection';
import { useCallback, useMemo, useState, useRef } from 'react';
import * as THREE from 'three';

interface CubeSceneProps {
  cubeState: CubeState;
  centers: FaceColor[];
  animatingMove: Move | null;
  animationDuration: number;
  onAnimationComplete: () => void;
  onMove: (move: Move) => void;
  highlightedPieces: Set<string>;
  minSwipeDistance: number;
  gyroBeta: number;
  gyroGamma: number;
}

// Determine which face is most camera-facing
function computeFrontFace(cameraX: number, cameraY: number, cameraZ: number): FaceName {
  const dots: [FaceName, number][] = [
    ['U', cameraY],
    ['D', -cameraY],
    ['R', cameraX],
    ['L', -cameraX],
    ['F', cameraZ],
    ['B', -cameraZ],
  ];
  dots.sort((a, b) => b[1] - a[1]);
  return dots[0]![0];
}

function CubeInteraction({
  cubeState,
  centers,
  animatingMove,
  animationDuration,
  onAnimationComplete,
  onMove,
  highlightedPieces,
  minSwipeDistance,
  gyroBeta,
  gyroGamma,
}: CubeSceneProps) {
  const [highlightedCubie, setHighlightedCubie] = useState<string | null>(null);
  const [highlightedFace, setHighlightedFace] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  const handleHighlight = useCallback((cubieKey: string | null, faceDir: string | null) => {
    setHighlightedCubie(cubieKey);
    setHighlightedFace(faceDir);
  }, []);

  // Gyro → cube rotation (beta=x-axis, gamma=y-axis)
  const betaRad = (gyroBeta * Math.PI) / 180;
  const gammaRad = (gyroGamma * Math.PI) / 180;

  const frontFace = useMemo(() => computeFrontFace(3.46, 4, 6.93), []);

  const { handlePointerDown, handlePointerUp } = useSwipeDetection(
    onMove,
    handleHighlight,
    minSwipeDistance,
    frontFace,
  );

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />
      <directionalLight position={[-3, -2, 4]} intensity={0.3} />
      <group
        ref={groupRef}
        rotation={[betaRad, gammaRad, 0]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <CubeGroup
          cubeState={cubeState}
          centers={centers}
          animatingMove={animatingMove}
          animationDuration={animationDuration}
          onAnimationComplete={onAnimationComplete}
          highlightedPieces={highlightedPieces}
          highlightedCubie={highlightedCubie}
          highlightedFace={highlightedFace}
        />
      </group>
    </>
  );
}

export function CubeScene(props: CubeSceneProps) {
  return (
    <Canvas
      camera={{
        position: [3.46, 4, 6.93],
        fov: 40,
        near: 0.1,
        far: 100,
      }}
      style={{ touchAction: 'none' }}
      gl={{ antialias: true }}
    >
      <CubeInteraction {...props} />
    </Canvas>
  );
}
