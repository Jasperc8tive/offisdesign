import type { Meta, StoryObj } from '@storybook/react';
import { Heading } from './Heading';
import { Text } from './Text';
import { Display } from './Display';

const meta: Meta = { title: 'Foundation/Typography' };
export default meta;
type Story = StoryObj;

export const Headings: Story = {
  render: () => (
    <div className="space-y-4 p-8">
      <Heading level={1}>The Branch Furniture rebuild</Heading>
      <Heading level={2}>Heading two — Frank Ruhl Libre</Heading>
      <Heading level={3}>Heading three</Heading>
      <Heading level={4}>Heading four</Heading>
    </div>
  ),
};

export const Body: Story = {
  render: () => (
    <div className="max-w-prose space-y-3 p-8">
      <Text>
        Default body text uses Quicksand at 16px with 1.6 line height. Long-form paragraphs sit
        comfortably on the brand background.
      </Text>
      <Text size="sm" tone="muted">
        Small text in muted tone — used for metadata and supporting copy.
      </Text>
      <Text size="caption" tone="muted">
        Caption — 12px, smallest type allowed.
      </Text>
      <Text tone="primary" weight="semibold">
        Primary tone for inline accent.
      </Text>
    </div>
  ),
};

export const DisplayText: Story = {
  render: () => (
    <div className="space-y-4 p-8">
      <Display size="lg">Branch.</Display>
      <Display size="md">Made to last.</Display>
      <Display size="sm">Built in Britain.</Display>
    </div>
  ),
};
