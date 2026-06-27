import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, useTheme } from './ThemeProvider';

const meta: Meta = { title: 'Foundation/Theme' };
export default meta;
type Story = StoryObj;

function Inspector() {
  const { theme, name } = useTheme();
  return (
    <pre className="bg-primary-subtle text-body-sm text-secondary overflow-auto rounded-md p-4">
      {JSON.stringify({ name, colors: theme.colors, layout: theme.layout }, null, 2)}
    </pre>
  );
}

export const Light: Story = {
  render: () => (
    <ThemeProvider theme="light">
      <div className="p-6">
        <Inspector />
      </div>
    </ThemeProvider>
  ),
};
