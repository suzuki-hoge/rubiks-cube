import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Move } from '../types';
import type { RankedSolution, SolutionsByFace } from '../cube/solutionSelector';

const FACE_ORDER = ['B', 'R', 'G', 'O'] as const;
const FACE_LABELS: Record<string, string> = { B: '青', R: '赤', G: '緑', O: '橙' };

interface CrossSolutionProps {
  solutionsByFace: SolutionsByFace;
  solving: boolean;
  onExecuteMove: (move: Move) => void;
  onUndo: () => void;
}

export function CrossSolution({
  solutionsByFace,
  solving,
  onExecuteMove,
  onUndo,
}: CrossSolutionProps) {
  const [selectedFace, setSelectedFace] = useState<string>('B');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [stepIdx, setStepIdx] = useState(0);

  const solutions = useMemo(
    () => solutionsByFace[selectedFace] ?? [],
    [solutionsByFace, selectedFace],
  );

  const currentSolution = useMemo(
    () => (selectedIdx !== null ? (solutions[selectedIdx]?.moves ?? []) : []),
    [solutions, selectedIdx],
  );

  const hasSolutions = Object.keys(solutionsByFace).length > 0;

  // Reset selection when solutions change
  useEffect(() => {
    setSelectedIdx(null);
    setStepIdx(0);
  }, [solutionsByFace]);

  // Reset tab when face changes
  useEffect(() => {
    // Undo any applied moves first
    for (let i = 0; i < stepIdx; i++) onUndo();
    setSelectedIdx(null);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFace]);

  const handleToggleTab = useCallback(
    (idx: number) => {
      for (let i = 0; i < stepIdx; i++) onUndo();
      setStepIdx(0);

      if (selectedIdx === idx) {
        setSelectedIdx(null);
      } else {
        setSelectedIdx(idx);
      }
    },
    [selectedIdx, stepIdx, onUndo],
  );

  const handleMoveTap = useCallback(
    (moveIdx: number) => {
      const target = moveIdx + 1;
      if (target === stepIdx) return;

      if (target > stepIdx) {
        for (let i = stepIdx; i < target; i++) {
          const move = currentSolution[i];
          if (move) onExecuteMove(move);
        }
      } else {
        for (let i = 0; i < stepIdx - target; i++) onUndo();
      }
      setStepIdx(target);
    },
    [stepIdx, currentSolution, onExecuteMove, onUndo],
  );

  if (!solving && !hasSolutions) {
    return (
      <div className="cross-solution">
        <div className="cross-empty">シャッフルしてください</div>
      </div>
    );
  }

  if (solving) {
    return (
      <div className="cross-solution">
        <div className="cross-empty">
          <span className="cross-spinner" />
          計算中...
        </div>
      </div>
    );
  }

  return (
    <div className="cross-solution">
      <div className="cross-face-row">
        {FACE_ORDER.map((face) => (
          <button
            key={face}
            className={`cross-face-btn face-${face} ${face === selectedFace ? 'active' : ''}`}
            onClick={() => setSelectedFace(face)}
          >
            {FACE_LABELS[face]}
          </button>
        ))}
      </div>
      <div className="cross-tabs">
        {solutions.map((sol, i) => (
          <button
            key={i}
            className={`cross-tab ${i === selectedIdx ? 'active' : ''}`}
            onClick={() => handleToggleTab(i)}
          >
            <TabLabel sol={sol} />
          </button>
        ))}
      </div>
      {selectedIdx !== null && (
        <div className="cross-moves">
          {currentSolution.map((move, i) => (
            <span
              key={i}
              className={`cross-move ${i < stepIdx ? 'done' : ''} ${i === stepIdx ? 'current' : ''}`}
              onClick={() => handleMoveTap(i)}
            >
              {move}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TabLabel({ sol }: { sol: RankedSolution }) {
  const isErgo = sol.category === '最良';
  const mainText = isErgo ? `${sol.score}点` : `${sol.moveCount}手`;

  return (
    <>
      <span className="tab-main">{mainText}</span>
      {sol.hasB && <span className="tab-icon tab-icon-b">B</span>}
      {sol.hasY && <span className="tab-icon tab-icon-y">y</span>}
    </>
  );
}
