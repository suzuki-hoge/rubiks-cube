import { Canvas } from '@react-three/fiber';
import { CubeGroup } from './CubeGroup';
import type { CubeState, FaceColor, FaceName, Move } from '../types';
import { useSwipeDetection } from '../hooks/useSwipeDetection';
import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
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

  // Camera angles influenced by gyroscope
  const basePhi = Math.PI / 6;
  const baseTheta = Math.PI / 6;
  const phi = basePhi - (gyroBeta * Math.PI) / 180;
  const theta = baseTheta + (gyroGamma * Math.PI) / 180;
  const distance = 8;
  const cameraX = distance * Math.cos(phi) * Math.sin(theta);
  const cameraY = distance * Math.sin(phi);
  const cameraZ = distance * Math.cos(phi) * Math.cos(theta);

  const frontFace = useMemo(
    () => computeFrontFace(cameraX, cameraY, cameraZ),
    [cameraX, cameraY, cameraZ],
  );

  const { handlePointerDown, handlePointerUp } = useSwipeDetection(
    onMove,
    handleHighlight,
    minSwipeDistance,
    frontFace,
  );

  return (
    <>
      <perspectiveCamera position={[cameraX, cameraY, cameraZ]} fov={40} near={0.1} far={100} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />
      <directionalLight position={[-3, -2, 4]} intensity={0.3} />
      <group ref={groupRef} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
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

const cameraLogCountRef = { current: 0 };

export function CubeScene(props: CubeSceneProps) {
  const { gyroBeta, gyroGamma } = props;

  const basePhi = Math.PI / 6;
  const baseTheta = Math.PI / 6;
  const phi = basePhi - (gyroBeta * Math.PI) / 180;
  const theta = baseTheta + (gyroGamma * Math.PI) / 180;
  const distance = 8;
  const cameraX = distance * Math.cos(phi) * Math.sin(theta);
  const cameraY = distance * Math.sin(phi);
  const cameraZ = distance * Math.cos(phi) * Math.cos(theta);

  useEffect(() => {
    if (gyroBeta === 0 && gyroGamma === 0) return;
    cameraLogCountRef.current++;
    if (cameraLogCountRef.current <= 5 || cameraLogCountRef.current % 100 === 0) {
      console.log(`[CAMERA] #${cameraLogCountRef.current}`, {
        gyroBeta: gyroBeta.toFixed(2),
        gyroGamma: gyroGamma.toFixed(2),
        cameraX: cameraX.toFixed(2),
        cameraY: cameraY.toFixed(2),
        cameraZ: cameraZ.toFixed(2),
      });
    }
  }, [gyroBeta, gyroGamma, cameraX, cameraY, cameraZ]);

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
