import type { Meta, StoryObj } from '@storybook/react-vite';
import { SettingsModal } from './SettingsModal';
import { DEFAULT_SETTINGS } from '../hooks/useSettings';
import { fn } from 'storybook/test';

const meta: Meta<typeof SettingsModal> = {
  component: SettingsModal,
  args: {
    open: true,
    onClose: fn(),
    onUpdate: fn(),
    onReset: fn(),
    settings: DEFAULT_SETTINGS,
  },
};
export default meta;

type Story = StoryObj<typeof SettingsModal>;

export const Default: Story = {
  name: 'デフォルト設定',
};

export const CustomSettings: Story = {
  name: 'カスタム設定',
  args: {
    settings: {
      gyro: { sensitivity: 2.0, maxAngle: 60 },
      shake: { threshold: 15, cooldown: 600 },
      swipe: { minDistance: 40, animationDuration: 500 },
      f2l: {
        eoBonus: 50,
        backSlotBonus: 40,
        visibilityBothBonus: 60,
        visibilityCornerOnlyBonus: 30,
        visibilityEdgeOnlyBonus: 20,
      },
    },
  },
};
