import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { CubeScene } from './components/CubeScene';
import { ControlBar } from './components/ControlBar';
import { ScrambleModal } from './components/ScrambleModal';
import { CrossSolution } from './components/CrossSolution';
import { F2LGuide } from './components/F2LGuide';
import { SettingsModal } from './components/SettingsModal';
import { useCubeState } from './hooks/useCubeState';
import { useSettings } from './hooks/useSettings';
import { useGyroscope } from './hooks/useGyroscope';
import { useCrossSolver } from './hooks/useCrossSolver';
import { F2L_SLOTS } from './cube/f2lScoring';
import type { Move } from './types';

// Absolute y-rotation to bring each cross-face color to front (white bottom, blue default front)
const FACE_ROTATION: Record<string, Move | null> = {
  B: null,
  R: 'y',
  G: 'y2',
  O: "y'",
};

// After a y-rotation, which face becomes the new front?
const FACE_AFTER_Y: Record<string, Record<string, string>> = {
  y: { B: 'R', R: 'G', G: 'O', O: 'B' },
  "y'": { B: 'O', O: 'G', G: 'R', R: 'B' },
  y2: { B: 'G', G: 'B', R: 'O', O: 'R' },
};

// Relative y-rotation between all face pairs: FACE_TRANSITION[from][to]
const FACE_TRANSITION: Record<string, Record<string, Move | null>> = {
  B: { B: null, R: 'y', G: 'y2', O: "y'" },
  R: { B: "y'", R: null, G: 'y', O: 'y2' },
  G: { B: 'y2', R: "y'", G: null, O: 'y' },
  O: { B: 'y', R: 'y2', G: "y'", O: null },
};

// Inverse of each move (for animated undo)
const INVERSE_MOVE: Record<string, Move> = {
  U: "U'",
  "U'": 'U',
  U2: 'U2',
  D: "D'",
  "D'": 'D',
  D2: 'D2',
  R: "R'",
  "R'": 'R',
  R2: 'R2',
  L: "L'",
  "L'": 'L',
  L2: 'L2',
  F: "F'",
  "F'": 'F',
  F2: 'F2',
  B: "B'",
  "B'": 'B',
  B2: 'B2',
  x: "x'",
  "x'": 'x',
  x2: 'x2',
  y: "y'",
  "y'": 'y',
  y2: 'y2',
  z: "z'",
  "z'": 'z',
  z2: 'z2',
};

type QueueItem = { move: Move; action: 'execute' | 'undo' };

export default function App() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const {
    cubeState,
    centers,
    scramble,
    scrambledState,
    animatingMove,
    executeMove,
    shuffle,
    retry,
    setAnimating,
    undo,
  } = useCubeState();

  const {
    beta,
    gamma,
    enabled: gyroEnabled,
    toggle: toggleGyro,
    resetBase: gyroResetBase,
  } = useGyroscope(settings);

  const { solutionsByFace, solving: crossSolving } = useCrossSolver(scrambledState, scramble);

  const [selectedFace, setSelectedFace] = useState<string>('B');
  const [solutionResetKey, setSolutionResetKey] = useState(0);
  const [scrambleModalOpen, setScrambleModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activeF2LSlot, setActiveF2LSlot] = useState<string | null>(null);

  // --- Move queue for animated cross solution / face rotation ---
  const [moveQueue, setMoveQueue] = useState<QueueItem[]>([]);
  const pendingActionRef = useRef<'execute' | 'undo'>('execute');
  const faceRotationRef = useRef<Move | null>(null);
  const currentFaceRef = useRef<string>('B');

  // Process queue: when no animation playing and queue has items, start next
  useEffect(() => {
    if (!animatingMove && moveQueue.length > 0) {
      const next = moveQueue[0]!;
      pendingActionRef.current = next.action;
      setMoveQueue((prev) => prev.slice(1));
      setAnimating(next.move);
    }
  }, [animatingMove, moveQueue, setAnimating]);

  // Swipe handler — clears queue to avoid conflicts
  const handleMove = useCallback(
    (move: Move) => {
      if (animatingMove) return;
      setMoveQueue([]);
      pendingActionRef.current = 'execute';
      setAnimating(move);

      // Sync cross-face buttons when swiping y rotations
      const newFace = FACE_AFTER_Y[move]?.[selectedFace];
      if (newFace) {
        setSelectedFace(newFace);
        currentFaceRef.current = newFace;
        faceRotationRef.current = FACE_ROTATION[newFace] ?? null;
      }
    },
    [animatingMove, setAnimating, selectedFace],
  );

  // Animation complete: execute or undo depending on pending action
  const handleAnimationComplete = useCallback(() => {
    if (animatingMove) {
      if (pendingActionRef.current === 'undo') {
        undo();
      } else {
        executeMove(animatingMove);
      }
    }
    pendingActionRef.current = 'execute';
    setAnimating(null);
  }, [animatingMove, executeMove, undo, setAnimating]);

  // Cross solution: queue a move for animated forward execution
  const handleCrossMoveExecute = useCallback((move: Move) => {
    setMoveQueue((prev) => [...prev, { move, action: 'execute' }]);
  }, []);

  // Cross solution: queue inverse animation + undo for backward step
  const handleCrossUndoMove = useCallback((move: Move) => {
    const inverse = INVERSE_MOVE[move];
    if (inverse) {
      setMoveQueue((prev) => [...prev, { move: inverse, action: 'undo' }]);
    }
  }, []);

  // Face change: undo solution moves (instant), then animate relative rotation
  const handleFaceChange = useCallback(
    (face: string) => {
      setMoveQueue([]);
      setAnimating(null);
      pendingActionRef.current = 'execute';

      const oldFace = currentFaceRef.current;
      const relativeMove = FACE_TRANSITION[oldFace]?.[face] ?? null;

      // Instant: reset to scrambled + restore old face rotation
      retry();
      const oldRotation = FACE_ROTATION[oldFace] ?? null;
      if (oldRotation) executeMove(oldRotation);

      // Update tracking
      currentFaceRef.current = face;
      faceRotationRef.current = FACE_ROTATION[face] ?? null;
      setSelectedFace(face);

      // Animate relative rotation from old face to new face
      if (relativeMove) {
        setMoveQueue([{ move: relativeMove, action: 'execute' }]);
      }
    },
    [retry, executeMove, setAnimating],
  );

  // Tab toggle: reset to scrambled + face rotation (instant, no animation)
  const handleResetSolution = useCallback(() => {
    setMoveQueue([]);
    setAnimating(null);
    pendingActionRef.current = 'execute';
    retry();
    if (faceRotationRef.current) {
      executeMove(faceRotationRef.current);
    }
  }, [retry, executeMove, setAnimating]);

  // Wrap shuffle to also reset face rotation and queue
  const handleShuffle = useCallback(() => {
    setMoveQueue([]);
    setAnimating(null);
    pendingActionRef.current = 'execute';
    faceRotationRef.current = null;
    currentFaceRef.current = 'B';
    setSelectedFace('B');
    shuffle();
  }, [shuffle, setAnimating]);

  // Wrap retry to re-apply face rotation
  const handleRetry = useCallback(() => {
    setMoveQueue([]);
    setAnimating(null);
    pendingActionRef.current = 'execute';
    setSolutionResetKey((k) => k + 1);
    setActiveF2LSlot(null);
    retry();
    if (faceRotationRef.current) {
      executeMove(faceRotationRef.current);
    }
  }, [retry, executeMove, setAnimating]);

  const toggleF2LSlot = useCallback((slotName: string) => {
    setActiveF2LSlot((prev) => (prev === slotName ? null : slotName));
  }, []);

  // Build set of highlighted piece IDs from active F2L slot
  const highlightedPieces = useMemo(() => {
    if (!activeF2LSlot) return new Set<string>();
    const slot = F2L_SLOTS.find((s) => s.name === activeF2LSlot);
    if (!slot) return new Set<string>();
    return new Set([`corner-${slot.cornerPiece}`, `edge-${slot.edgePiece}`]);
  }, [activeF2LSlot]);

  return (
    <div className="app">
      <ControlBar
        onShuffle={handleShuffle}
        onRetry={handleRetry}
        onShowScramble={() => setScrambleModalOpen(true)}
        onShowSettings={() => setSettingsModalOpen(true)}
        gyroEnabled={gyroEnabled}
        onRequestGyro={toggleGyro}
        onGyroReset={gyroResetBase}
      />

      <div className="cube-container">
        <CubeScene
          cubeState={cubeState}
          centers={centers}
          animatingMove={animatingMove}
          animationDuration={settings.swipe.animationDuration}
          onAnimationComplete={handleAnimationComplete}
          onMove={handleMove}
          highlightedPieces={highlightedPieces}
          minSwipeDistance={settings.swipe.minDistance}
          gyroBeta={beta}
          gyroGamma={gamma}
        />
      </div>

      <CrossSolution
        solutionsByFace={solutionsByFace}
        solving={crossSolving}
        selectedFace={selectedFace}
        solutionResetKey={solutionResetKey}
        onExecuteMove={handleCrossMoveExecute}
        onUndoMove={handleCrossUndoMove}
        onFaceChange={handleFaceChange}
        onResetSolution={handleResetSolution}
      />

      <F2LGuide
        cubeState={cubeState}
        settings={settings}
        activeSlots={activeF2LSlot ? new Set([activeF2LSlot]) : new Set<string>()}
        onToggleSlot={toggleF2LSlot}
      />

      <ScrambleModal
        scramble={scramble}
        open={scrambleModalOpen}
        onClose={() => setScrambleModalOpen(false)}
      />

      <SettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onUpdate={updateSettings}
        onReset={resetSettings}
      />
    </div>
  );
}
