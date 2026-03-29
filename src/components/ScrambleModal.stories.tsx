import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrambleModal } from './ScrambleModal';
import { fn } from 'storybook/test';

const meta: Meta<typeof ScrambleModal> = {
  component: ScrambleModal,
  args: {
    open: true,
    onClose: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof ScrambleModal>;

export const WithScramble: Story = {
  name: 'スクランブルあり',
  args: {
    scramble: [
      'R',
      'U',
      "R'",
      "U'",
      'F',
      "R'",
      'F2',
      'L',
      "D'",
      'B',
      'U2',
      "L'",
      'D',
      "F'",
      'R2',
      "U'",
      'B2',
      'L',
      'D2',
      "R'",
    ],
  },
};

export const Empty: Story = {
  name: 'シャッフル前',
  args: {
    scramble: [],
  },
};
