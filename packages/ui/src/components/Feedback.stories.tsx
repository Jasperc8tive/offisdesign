import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Inbox } from 'lucide-react';
import { Alert } from './Alert';
import { Tooltip } from './Tooltip';
import { Spinner } from './Spinner';
import { Progress } from './Progress';
import { EmptyState } from './EmptyState';
import { Button } from './Button';
import { Stack } from '../layout/Stack';
import { Cluster } from '../layout/Cluster';

const meta: Meta = { title: 'Components/Feedback' };
export default meta;
type Story = StoryObj;

export const Alerts: Story = {
  render: () => (
    <Stack gap={3} className="max-w-xl p-8">
      <Alert variant="info" title="Delivery & installation">
        Professional delivery and setup across Nigeria.
      </Alert>
      <Alert variant="success" title="Saved" onDismiss={() => undefined}>
        Your changes were saved.
      </Alert>
      <Alert variant="warning" title="Heads up">
        Stock is running low — only 2 left.
      </Alert>
      <Alert variant="error" title="Something went wrong">
        Please try again.
      </Alert>
    </Stack>
  ),
};

export const Tooltips: Story = {
  render: () => (
    <Cluster gap={6} className="p-16">
      <Tooltip content="Top tooltip" side="top">
        <Button variant="outline">Hover me</Button>
      </Tooltip>
      <Tooltip content="Bottom tooltip" side="bottom">
        <Button variant="outline">Bottom</Button>
      </Tooltip>
      <Tooltip content="Right tooltip" side="right">
        <Button variant="outline">Right</Button>
      </Tooltip>
    </Cluster>
  ),
};

export const Spinners: Story = {
  render: () => (
    <Cluster gap={6} align="center" className="p-8">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </Cluster>
  ),
};

export const Progresses: Story = {
  render: () => {
    const [pct, setPct] = useState(35);
    return (
      <Stack gap={4} className="max-w-md p-8">
        <Progress value={pct} label="Upload progress" />
        <Cluster gap={2}>
          <Button size="sm" variant="outline" onClick={() => setPct((v) => Math.max(0, v - 10))}>
            -10
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPct((v) => Math.min(100, v + 10))}>
            +10
          </Button>
        </Cluster>
      </Stack>
    );
  },
};

export const EmptyStates: Story = {
  render: () => (
    <div className="p-8">
      <EmptyState
        icon={<Inbox width={32} height={32} aria-hidden />}
        title="No saved items yet"
        description="Heart products as you browse to save them here."
        action={<Button>Start browsing</Button>}
      />
    </div>
  ),
};
