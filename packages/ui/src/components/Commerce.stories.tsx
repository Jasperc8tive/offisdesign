import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PriceTag } from './PriceTag';
import { Quantity } from './Quantity';
import { Swatch } from './Swatch';
import { Rating } from './Rating';
import { Stack } from '../layout/Stack';
import { Cluster } from '../layout/Cluster';
import { Text } from '../typography/Text';

const meta: Meta = { title: 'Components/Commerce' };
export default meta;
type Story = StoryObj;

export const Prices: Story = {
  render: () => (
    <Stack gap={3} className="p-8">
      <PriceTag amount={129900} />
      <PriceTag amount={89900} originalAmount={129900} />
      <PriceTag amount={250000} size="lg" />
    </Stack>
  ),
};

export const QuantityStepper: Story = {
  render: () => {
    const [n, setN] = useState(1);
    return (
      <Stack gap={3} className="p-8">
        <Quantity value={n} onChange={setN} />
        <Text size="sm" tone="muted">
          Value: {n}
        </Text>
      </Stack>
    );
  },
};

export const Swatches: Story = {
  render: () => {
    const [v, setV] = useState('oak');
    return (
      <Stack gap={3} className="p-8">
        <Swatch
          name="Wood"
          value={v}
          onChange={setV}
          options={[
            { value: 'oak', label: 'Oak', color: '#C9A66B' },
            { value: 'walnut', label: 'Walnut', color: '#5C3A21' },
            { value: 'ash', label: 'Ash', color: '#E8DCC2' },
            { value: 'black', label: 'Black', color: '#1A1A1A' },
          ]}
        />
        <Text size="sm" tone="muted">
          Selected: {v}
        </Text>
      </Stack>
    );
  },
};

export const Ratings: Story = {
  render: () => (
    <Cluster gap={6} className="p-8">
      <Rating value={4.5} reviewCount={128} />
      <Rating value={3} reviewCount={42} size="sm" />
      <Rating value={5} size="lg" />
    </Cluster>
  ),
};
