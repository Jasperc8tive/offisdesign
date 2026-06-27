import type { Meta, StoryObj } from '@storybook/react';
import { breakpoints } from './breakpoints';

const meta: Meta = { title: 'Foundation/Tokens/Breakpoints' };
export default meta;
type Story = StoryObj;

export const All: Story = {
  render: () => (
    <div className="font-body p-8">
      <table className="w-full max-w-md text-left">
        <thead className="text-secondary">
          <tr>
            <th className="py-2">Token</th>
            <th className="py-2">Min width</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(breakpoints).map(([k, v]) => (
            <tr key={k} className="border-border border-t">
              <td className="py-2 font-semibold">{k}</td>
              <td className="text-muted py-2">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};
