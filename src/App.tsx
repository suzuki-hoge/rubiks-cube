import { useState, useCallback, useMemo } from 'react';
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

export default function App() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const {
    cubeState,
    scramble,
    scrambledState,
    animatingMove,
    executeMove,
    shuffle,
    retry,
    setAnimating,
    undo,
  } = useCubeState();

  const { beta, gamma, permitted, requestPermission } = useGyroscope(settings);

  const crossSolutions = useCrossSolver(scrambledState, scramble);

  const [scrambleModalOpen, setScrambleModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activeF2LSlots, setActiveF2LSlots] = useState<Set<string>>(new Set());

  const handleMove = useCallback(
    (move: Move) => {
      if (animatingMove) return; // ignore if already animating
      setAnimating(move);
    },
    [animatingMove, setAnimating],
  );

  const handleAnimationComplete = useCallback(() => {
    if (animatingMove) {
      executeMove(animatingMove);
    }
    setAnimating(null);
  }, [animatingMove, executeMove, setAnimating]);

  const handleCrossMoveExecute = useCallback(
    (move: Move) => {
      executeMove(move);
    },
    [executeMove],
  );

  const toggleF2LSlot = useCallback((slotName: string) => {
    setActiveF2LSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slotName)) {
        next.delete(slotName);
      } else {
        next.add(slotName);
      }
      return next;
    });
  }, []);

  // Build set of glowing piece IDs from active F2L slots
  const glowingPieces = useMemo(() => {
    const pieces = new Set<string>();
    for (const slotName of activeF2LSlots) {
      const slot = F2L_SLOTS.find((s) => s.name === slotName);
      if (slot) {
        pieces.add(`corner-${slot.cornerPiece}`);
        pieces.add(`edge-${slot.edgePiece}`);
      }
    }
    return pieces;
  }, [activeF2LSlots]);

  return (
    <div className="app">
      <ControlBar
        onShuffle={shuffle}
        onRetry={retry}
        onShowScramble={() => setScrambleModalOpen(true)}
        onShowSettings={() => setSettingsModalOpen(true)}
        onRequestGyro={requestPermission}
        gyroPermitted={permitted}
      />

      <div className="cube-container">
        <CubeScene
          cubeState={cubeState}
          animatingMove={animatingMove}
          animationDuration={settings.swipe.animationDuration}
          onAnimationComplete={handleAnimationComplete}
          onMove={handleMove}
          glowingPieces={glowingPieces}
          minSwipeDistance={settings.swipe.minDistance}
          gyroBeta={beta}
          gyroGamma={gamma}
        />
      </div>

      <CrossSolution
        solutions={crossSolutions}
        onExecuteMove={handleCrossMoveExecute}
        onUndo={undo}
        animationDuration={settings.swipe.animationDuration}
      />

      <F2LGuide
        cubeState={cubeState}
        settings={settings}
        activeSlots={activeF2LSlots}
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
