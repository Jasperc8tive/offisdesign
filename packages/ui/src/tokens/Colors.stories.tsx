import type { Meta, StoryObj } from '@storybook/react';
import { palette, states } from './colors';

const meta: Meta = {
  title: 'Foundation/Tokens/Colors',
};
export default meta;

type Story = StoryObj;

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="border-border h-20 w-full rounded-md border"
        style={{ background: value }}
        aria-label={`${name} swatch`}
      />
      <div className="font-body text-body-sm">
        <div className="text-secondary font-semibold">{name}</div>
        <div className="text-muted">{value}</div>
      </div>
    </div>
  );
}

export const Palette: Story = {
  render: () => (
    <div className="p-8">
      <h2 className="font-heading text-h3 text-secondary mb-4">Brand palette</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {Object.entries(palette).map(([k, v]) => (
          <Swatch key={k} name={k} value={v} />
        ))}
      </div>
      <h2 className="font-heading text-h3 text-secondary mb-4 mt-12">Derived states</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Object.entries(states).map(([k, v]) => (
          <Swatch key={k} name={k} value={v} />
        ))}
      </div>
    </div>
  ),
};
