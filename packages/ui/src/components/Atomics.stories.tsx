import type { Meta, StoryObj } from '@storybook/react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { Tag } from './Tag';
import { Card, CardHeader, CardBody, CardFooter } from './Card';
import { Avatar } from './Avatar';
import { Skeleton } from './Skeleton';
import { Heading } from '../typography/Heading';
import { Text } from '../typography/Text';
import { Stack } from '../layout/Stack';
import { Cluster } from '../layout/Cluster';

const meta: Meta = { title: 'Components/Atomics' };
export default meta;
type Story = StoryObj;

export const Buttons: Story = {
  render: () => (
    <Stack gap={4} className="p-8">
      <Cluster gap={3}>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </Cluster>
      <Cluster gap={3} align="center">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </Cluster>
      <Cluster gap={3} align="center">
        <Button leadingIcon={<ShoppingBag width={16} height={16} aria-hidden />}>Add to bag</Button>
        <Button trailingIcon={<ArrowRight width={16} height={16} aria-hidden />}>Continue</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </Cluster>
    </Stack>
  ),
};

export const Badges: Story = {
  render: () => (
    <Cluster gap={3} className="p-8">
      <Badge>New</Badge>
      <Badge variant="secondary">Featured</Badge>
      <Badge variant="outline">Limited</Badge>
      <Badge variant="muted">Sale</Badge>
    </Cluster>
  ),
};

export const Tags: Story = {
  render: () => (
    <Cluster gap={3} className="p-8">
      <Tag>Mesh</Tag>
      <Tag onRemove={() => undefined}>Leather</Tag>
      <Tag onRemove={() => undefined}>₦100,000 – ₦500,000</Tag>
    </Cluster>
  ),
};

export const Cards: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Heading level={4}>Static card</Heading>
          <Text size="sm" tone="muted">
            Use to group related content with a hairline border and subtle elevation.
          </Text>
        </CardHeader>
        <CardBody>
          <Text>Body copy lives here.</Text>
        </CardBody>
        <CardFooter>
          <Text size="sm" tone="muted">
            Footer
          </Text>
          <Button size="sm">Action</Button>
        </CardFooter>
      </Card>
      <Card interactive tabIndex={0}>
        <CardHeader>
          <Heading level={4}>Interactive card</Heading>
          <Text size="sm" tone="muted">
            Keyboard focusable; lifts on hover/focus.
          </Text>
        </CardHeader>
        <CardBody>
          <Text>Click anywhere on the card.</Text>
        </CardBody>
      </Card>
    </div>
  ),
};

export const Avatars: Story = {
  render: () => (
    <Cluster gap={4} align="center" className="p-8">
      <Avatar initials="MD" size="sm" alt="Mayowa D." />
      <Avatar initials="MD" size="md" alt="Mayowa D." />
      <Avatar initials="MD" size="lg" alt="Mayowa D." />
      <Avatar initials="MD" size="xl" alt="Mayowa D." />
    </Cluster>
  ),
};

export const Skeletons: Story = {
  render: () => (
    <Stack gap={3} className="max-w-md p-8">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-40 w-full" rounded="md" />
    </Stack>
  ),
};
