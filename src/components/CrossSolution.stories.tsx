import type { Meta, StoryObj } from '@storybook/react-vite';
import { CrossSolution, TabLabel } from './CrossSolution';
import type { RankedSolution } from '../cube/solutionSelector';
import type { Move } from '../types';
import { fn } from 'storybook/test';

// -- Mock data --

const mkSol = (
  moves: Move[],
  category: '最短' | '最良',
  hasB: boolean,
  hasY: boolean,
): RankedSolution => {
  const score = moves.length * 1.2;
  return {
    moves,
    category,
    hasB,
    hasY,
    moveCount: moves.length,
    score: Math.round(score * 10) / 10,
  };
};

const solutionsByFace = {
  B: [
    mkSol(["R'", 'D', "F'", "D'"], '最短', false, false),
    mkSol(["R'", 'D2', 'B', "D'", "B'"], '最短', true, false),
    mkSol(["R'", 'y', "L'", "D'"], '最良', false, true),
    mkSol(["R'", 'B', 'y', "D'", "B'"], '最良', true, true),
  ],
  R: [
    mkSol(['F2', 'D', "R'"], '最短', false, false),
    mkSol(['D', "F'", 'D2'], '最良', false, false),
  ],
  G: [mkSol(["L'", "D'", 'F2'], '最短', false, false)],
  O: [
    mkSol(['D', "L'", "D'", "F'"], '最短', false, false),
    mkSol(['y', 'D2', "R'"], '最良', false, true),
  ],
};

// -- CrossSolution stories --

const meta: Meta<typeof CrossSolution> = {
  component: CrossSolution,
  args: {
    selectedFace: 'B',
    solutionResetKey: 0,
    onExecuteMove: fn(),
    onUndoMove: fn(),
    onFaceChange: fn(),
    onResetSolution: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 375 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof CrossSolution>;

export const BeforeShuffle: Story = {
  name: 'シャッフル前',
  args: {
    solutionsByFace: {},
    solving: false,
  },
};

export const Calculating: Story = {
  name: '計算中',
  args: {
    solutionsByFace: {},
    solving: true,
  },
};

export const AfterCalculation: Story = {
  name: '計算後（未選択）',
  args: {
    solutionsByFace,
    solving: false,
  },
};

export const ShowingSolution: Story = {
  name: '解法表示中',
  args: {
    solutionsByFace,
    solving: false,
  },
  play: async ({ canvasElement }) => {
    // Click the first solution tab to show moves
    const tab = canvasElement.querySelector('.cross-tab');
    if (tab) (tab as HTMLElement).click();
  },
};

// -- TabLabel stories --

export const TabLabelVariants: StoryObj = {
  name: '解法ボタン一覧',
  render: () => {
    const variants: { label: string; sol: RankedSolution }[] = [
      {
        label: 'x手',
        sol: mkSol(["R'", 'D', "F'", "D'"], '最短', false, false),
      },
      {
        label: 'x手 B',
        sol: mkSol(["R'", 'B', "D'", "B'", 'D'], '最短', true, false),
      },
      {
        label: 'x手 y',
        sol: mkSol(["R'", 'y', "L'", "D'"], '最短', false, true),
      },
      {
        label: 'x手 B y',
        sol: mkSol(["R'", 'B', 'y', "D'", "B'"], '最短', true, true),
      },
      {
        label: 'x点',
        sol: mkSol(["R'", 'D', "F'", "D'"], '最良', false, false),
      },
      {
        label: 'x点 B',
        sol: mkSol(["R'", 'B', "D'", "B'", 'D'], '最良', true, false),
      },
      {
        label: 'x点 y',
        sol: mkSol(["R'", 'y', "L'", "D'"], '最良', false, true),
      },
      {
        label: 'x点 B y',
        sol: mkSol(["R'", 'B', 'y', "D'", "B'"], '最良', true, true),
      },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {variants.map((v, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#888', minWidth: 80 }}>{v.label}</span>
            <button className="cross-tab" style={{ pointerEvents: 'none' }}>
              <TabLabel sol={v.sol} />
            </button>
            <button className="cross-tab active" style={{ pointerEvents: 'none' }}>
              <TabLabel sol={v.sol} />
            </button>
          </div>
        ))}
      </div>
    );
  },
};
