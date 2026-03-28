import { useState, useCallback, useRef } from 'react';
import type { Move } from '../types';

interface CrossSolutionProps {
  solutions: Move[][];
  onExecuteMove: (move: Move) => void;
  onUndo: () => void;
  animationDuration: number;
}

export function CrossSolution({
  solutions,
  onExecuteMove,
  onUndo,
  animationDuration,
}: CrossSolutionProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSolution = solutions[selectedIdx] ?? [];

  const handleSelectSolution = useCallback((idx: number) => {
    setSelectedIdx(idx);
    setStepIdx(0);
    setIsPlaying(false);
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
  }, []);

  const stepForward = useCallback(() => {
    if (stepIdx >= currentSolution.length) return;
    const move = currentSolution[stepIdx];
    if (move) {
      onExecuteMove(move);
      setStepIdx((prev) => prev + 1);
    }
  }, [stepIdx, currentSolution, onExecuteMove]);

  const stepBack = useCallback(() => {
    if (stepIdx <= 0) return;
    onUndo();
    setStepIdx((prev) => prev - 1);
  }, [stepIdx, onUndo]);

  const playAll = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      return;
    }

    setIsPlaying(true);
    let step = stepIdx;

    function playNext() {
      if (step >= currentSolution.length) {
        setIsPlaying(false);
        return;
      }
      const move = currentSolution[step];
      if (move) {
        onExecuteMove(move);
        step++;
        setStepIdx(step);
        playTimerRef.current = setTimeout(playNext, animationDuration + 50);
      }
    }

    playNext();
  }, [isPlaying, stepIdx, currentSolution, onExecuteMove, animationDuration]);

  if (solutions.length === 0) {
    return (
      <div className="cross-solution">
        <div className="cross-label">白クロス解法</div>
        <div className="cross-empty">シャッフルしてください</div>
      </div>
    );
  }

  return (
    <div className="cross-solution">
      <div className="cross-label">白クロス解法</div>
      <div className="cross-tabs">
        {solutions.map((sol, i) => (
          <button
            key={i}
            className={`cross-tab ${i === selectedIdx ? 'active' : ''}`}
            onClick={() => handleSelectSolution(i)}
          >
            解{i + 1} ({sol.length}手)
          </button>
        ))}
      </div>
      <div className="cross-moves">
        {currentSolution.map((move, i) => (
          <span
            key={i}
            className={`cross-move ${i < stepIdx ? 'done' : ''} ${i === stepIdx ? 'current' : ''}`}
          >
            {move}
          </span>
        ))}
      </div>
      <div className="cross-controls">
        <button onClick={stepBack} disabled={stepIdx <= 0}>
          ◀
        </button>
        <button onClick={stepForward} disabled={stepIdx >= currentSolution.length}>
          ▶
        </button>
        <button onClick={playAll}>{isPlaying ? '⏸' : '▶▶'}</button>
      </div>
    </div>
  );
}
