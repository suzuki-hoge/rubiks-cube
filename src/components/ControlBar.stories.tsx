import type { Meta, StoryObj } from '@storybook/react-vite';
import { ControlBar } from './ControlBar';
import { fn } from 'storybook/test';

const meta: Meta<typeof ControlBar> = {
  component: ControlBar,
  args: {
    onShuffle: fn(),
    onRetry: fn(),
    onShowScramble: fn(),
    onShowSettings: fn(),
    onRequestGyro: fn(),
    onGyroReset: fn(),
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

type Story = StoryObj<typeof ControlBar>;

export const Default: Story = {};
