import { Canvas } from '@react-three/fiber';
import { CubeGroup } from './CubeGroup';
import type { CubeState, Move } from '../types';
import { useSwipeDetection } from '../hooks/useSwipeDetection';
import { useCallback, useState, useRef } from 'react';
import * as THREE from 'three';

interface CubeSceneProps {
  cubeState: CubeState;
  animatingMove: Move | null;
  animationDuration: number;
  onAnimationComplete: () => void;
  onMove: (move: Move) => void;
  glowingPieces: Set<string>;
  minSwipeDistance: number;
  gyroBeta: number;
  gyroGamma: number;
}

function CubeInteraction({
  cubeState,
  animatingMove,
  animationDuration,
  onAnimationComplete,
  onMove,
  glowingPieces,
  minSwipeDistance,
  gyroBeta,
  gyroGamma,
}: CubeSceneProps) {
  const [highlightedFace, setHighlightedFace] = useState<string | null>(null);
  const [highlightedLayer, setHighlightedLayer] = useState<number | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  const handleHighlight = useCallback((face: string | null, layer: number | null) => {
    setHighlightedFace(face);
    setHighlightedLayer(layer);
  }, []);

  const { handlePointerDown, handlePointerUp } = useSwipeDetection(
    onMove,
    handleHighlight,
    minSwipeDistance,
  );

  // Camera angles influenced by gyroscope
  // Base angle: slightly tilted to show 3 faces (U, F, R)
  const basePhi = Math.PI / 6; // 30 degrees from top
  const baseTheta = Math.PI / 6; // 30 degrees from front

  const phi = basePhi - (gyroBeta * Math.PI) / 180;
  const theta = baseTheta + (gyroGamma * Math.PI) / 180;

  const distance = 7;
  const cameraX = distance * Math.cos(phi) * Math.sin(theta);
  const cameraY = distance * Math.sin(phi);
  const cameraZ = distance * Math.cos(phi) * Math.cos(theta);

  return (
    <>
      <perspectiveCamera position={[cameraX, cameraY, cameraZ]} fov={40} near={0.1} far={100} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />
      <directionalLight position={[-3, -2, 4]} intensity={0.3} />
      <group ref={groupRef} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
        <CubeGroup
          cubeState={cubeState}
          animatingMove={animatingMove}
          animationDuration={animationDuration}
          onAnimationComplete={onAnimationComplete}
          glowingPieces={glowingPieces}
          highlightedFace={highlightedFace}
          highlightedLayer={highlightedLayer}
        />
      </group>
    </>
  );
}

export function CubeScene(props: CubeSceneProps) {
  const { gyroBeta, gyroGamma } = props;

  // Compute camera position for Canvas
  const basePhi = Math.PI / 6;
  const baseTheta = Math.PI / 6;
  const phi = basePhi - (gyroBeta * Math.PI) / 180;
  const theta = baseTheta + (gyroGamma * Math.PI) / 180;
  const distance = 7;
  const cameraX = distance * Math.cos(phi) * Math.sin(theta);
  const cameraY = distance * Math.sin(phi);
  const cameraZ = distance * Math.cos(phi) * Math.cos(theta);

  return (
    <Canvas
      camera={{
        position: [cameraX, cameraY, cameraZ],
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
