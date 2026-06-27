import type { Preview } from '@storybook/react';
import '../src/tokens/tokens.css';
import './preview.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'background',
      values: [
        { name: 'background', value: 'var(--background)' },
        { name: 'secondary', value: 'var(--secondary)' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // Run axe on every story; design system must pass WCAG AA.
      element: '#storybook-root',
      manual: false,
    },
  },
};

export default preview;
