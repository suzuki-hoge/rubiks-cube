import type { Meta, StoryObj } from '@storybook/react-vite';
import { F2LGuide } from './F2LGuide';
import { DEFAULT_SETTINGS } from '../hooks/useSettings';
import type {
  CubeState,
  CornerPiece,
  CornerOrientation,
  EdgePiece,
  EdgeOrientation,
} from '../types';
import { fn } from 'storybook/test';

const solvedState: CubeState = {
  cp: [0, 1, 2, 3, 4, 5, 6, 7] as CornerPiece[],
  co: [0, 0, 0, 0, 0, 0, 0, 0] as CornerOrientation[],
  ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as EdgePiece[],
  eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as EdgeOrientation[],
};

const meta: Meta<typeof F2LGuide> = {
  component: F2LGuide,
  args: {
    cubeState: solvedState,
    settings: DEFAULT_SETTINGS,
    activeSlots: new Set<string>(),
    onToggleSlot: fn(),
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

type Story = StoryObj<typeof F2LGuide>;

export const NoActive: Story = {
  name: '未選択',
};

export const OneActive: Story = {
  name: '1つ選択',
  args: {
    activeSlots: new Set(['RF']),
  },
};

export const BackSlotActive: Story = {
  name: 'バックスロット選択',
  args: {
    activeSlots: new Set(['LB']),
  },
};
