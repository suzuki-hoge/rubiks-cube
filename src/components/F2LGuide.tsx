import { useMemo } from 'react';
import type { CubeState, Settings, F2LScore } from '../types';
import { scoreF2LPairs } from '../cube/f2lScoring';

interface F2LGuideProps {
  cubeState: CubeState;
  settings: Settings;
  activeSlots: Set<string>;
  onToggleSlot: (slotName: string) => void;
}

export function F2LGuide({ cubeState, settings, activeSlots, onToggleSlot }: F2LGuideProps) {
  const scores: F2LScore[] = useMemo(
    () => scoreF2LPairs(cubeState, settings),
    [cubeState, settings],
  );

  return (
    <div className="f2l-guide">
      {scores.map((s, i) => (
        <button
          key={s.slot.name}
          className={`f2l-btn ${activeSlots.has(s.slot.name) ? 'active' : ''}`}
          onClick={() => onToggleSlot(s.slot.name)}
          title={`${s.slot.name}: score=${s.score} EO=${s.eoGood ? '✓' : '✗'} corner=${s.cornerVisible ? '✓' : '✗'} edge=${s.edgeVisible ? '✓' : '✗'}`}
        >
          ペア{i + 1}
        </button>
      ))}
    </div>
  );
}
