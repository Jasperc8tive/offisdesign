import type { Meta, StoryObj } from '@storybook/react';
import { radius } from './radius';

const meta: Meta = { title: 'Foundation/Tokens/Radius' };
export default meta;
type Story = StoryObj;

export const All: Story = {
  render: () => (
    <div className="font-body flex flex-wrap gap-6 p-8">
      {Object.entries(radius).map(([k, v]) => (
        <div key={k} className="flex flex-col items-center gap-2">
          <div
            className="border-border-strong bg-primary-subtle h-24 w-24 border"
            style={{ borderRadius: v }}
          />
          <div className="text-body-sm text-secondary">{k}</div>
          <div className="text-caption text-muted">{v}</div>
        </div>
      ))}
    </div>
  ),
};
