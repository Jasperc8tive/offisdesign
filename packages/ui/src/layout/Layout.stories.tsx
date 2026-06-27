import type { Meta, StoryObj } from '@storybook/react';
import { Container } from './Container';
import { Stack } from './Stack';
import { Cluster } from './Cluster';
import { Grid } from './Grid';
import { Divider } from './Divider';
import { AspectRatio } from './AspectRatio';
import { VisuallyHidden } from './VisuallyHidden';

const meta: Meta = { title: 'Foundation/Layout' };
export default meta;
type Story = StoryObj;

const Box = ({ children }: { children?: React.ReactNode }) => (
  <div className="bg-primary-subtle text-secondary rounded-sm p-4">{children}</div>
);

export const ContainerExample: Story = {
  render: () => (
    <Container as="section" className="py-8">
      <Box>1120px max-width, gutters at 24/64px</Box>
    </Container>
  ),
};

export const StackExample: Story = {
  render: () => (
    <Stack gap={4} className="p-8">
      <Box>First</Box>
      <Box>Second</Box>
      <Box>Third</Box>
    </Stack>
  ),
};

export const ClusterExample: Story = {
  render: () => (
    <Cluster gap={3} className="p-8">
      <Box>One</Box>
      <Box>Two</Box>
      <Box>Three</Box>
      <Box>Four</Box>
    </Cluster>
  ),
};

export const GridExample: Story = {
  render: () => (
    <Grid cols={3} gap={4} className="p-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <Box key={i}>Item {i + 1}</Box>
      ))}
    </Grid>
  ),
};

export const DividerExample: Story = {
  render: () => (
    <Stack gap={4} className="p-8">
      <Box>Above</Box>
      <Divider />
      <Box>Below</Box>
    </Stack>
  ),
};

export const AspectRatioExample: Story = {
  render: () => (
    <div className="max-w-md p-8">
      <AspectRatio ratio={16 / 9} className="bg-primary-subtle rounded-md">
        <div className="text-secondary flex h-full w-full items-center justify-center">16 / 9</div>
      </AspectRatio>
    </div>
  ),
};

export const VisuallyHiddenExample: Story = {
  render: () => (
    <button className="bg-primary text-on-dark rounded-sm p-2">
      <span aria-hidden>✕</span>
      <VisuallyHidden>Close dialog</VisuallyHidden>
    </button>
  ),
};
