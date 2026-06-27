import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { motion as tokens } from './motion';

const meta: Meta = { title: 'Foundation/Tokens/Motion' };
export default meta;
type Story = StoryObj;

export const Durations: Story = {
  render: () => {
    const [n, setN] = useState(0);
    return (
      <div className="font-body p-8">
        <button
          onClick={() => setN((v) => v + 1)}
          className="bg-primary text-on-dark rounded-sm px-4 py-2"
        >
          Toggle
        </button>
        <div className="mt-8 flex gap-8">
          {(Object.entries(tokens.duration) as Array<[keyof typeof tokens.duration, number]>).map(
            ([k, ms]) => (
              <div key={k} className="flex flex-col items-center gap-2">
                <div
                  className="bg-primary h-16 w-16"
                  style={{
                    transitionProperty: 'transform',
                    transitionDuration: `${ms}ms`,
                    transitionTimingFunction: tokens.easing.standard,
                    transform: n % 2 ? 'translateX(80px)' : 'translateX(0)',
                  }}
                />
                <div className="text-body-sm text-secondary">{k}</div>
                <div className="text-caption text-muted">{ms}ms</div>
              </div>
            ),
          )}
        </div>
      </div>
    );
  },
};
