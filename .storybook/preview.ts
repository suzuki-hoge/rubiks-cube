import type { Preview } from '@storybook/react-vite';
import '../src/styles/index.css';

// Load JetBrains Mono from Google Fonts for Storybook
const link = document.createElement('link');
link.href =
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

const preview: Preview = {
  parameters: {
    layout: 'centered',
  },
};

export default preview;
