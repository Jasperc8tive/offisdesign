import type { Meta, StoryObj } from '@storybook/react';
import { shadows } from './shadows';

const meta: Meta = { title: 'Foundation/Tokens/Shadows' };
export default meta;
type Story = StoryObj;

export const All: Story = {
  render: () => (
    <div className="bg-background font-body flex flex-wrap gap-10 p-12">
      {Object.entries(shadows).map(([k, v]) => (
        <div key={k} className="flex flex-col items-center gap-3">
          <div className="bg-background h-28 w-28 rounded-md" style={{ boxShadow: v as string }} />
          <div className="text-body-sm text-secondary">{k}</div>
        </div>
      ))}
    </div>
  ),
};
