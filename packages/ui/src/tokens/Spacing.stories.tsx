import type { Meta, StoryObj } from '@storybook/react';
import { spacing } from './spacing';

const meta: Meta = { title: 'Foundation/Tokens/Spacing' };
export default meta;
type Story = StoryObj;

export const Scale: Story = {
  render: () => (
    <div className="font-body p-8">
      <h2 className="font-heading text-h3 text-secondary mb-6">Spacing scale (4px base)</h2>
      <div className="flex flex-col gap-3">
        {Object.entries(spacing).map(([k, v]) => (
          <div key={k} className="flex items-center gap-4">
            <div className="text-body-sm text-muted w-16">{k}</div>
            <div className="bg-primary h-4" style={{ width: v as string }} />
            <div className="text-body-sm">{v}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};
