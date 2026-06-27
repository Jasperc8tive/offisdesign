'use client';

import { Alert, Button, Card, CardBody, Cluster, Heading, Stack, Text } from '@offisdesign/ui';
import type { AddressValue } from './address-form';
import type { ShippingRate } from '../../lib/api/schemas';

interface Props {
  email: string;
  shippingAddress: AddressValue;
  billingAddress: AddressValue;
  shippingRate: ShippingRate;
  onEdit: (step: 'address' | 'shipping' | 'payment') => void;
  onPlaceOrder: () => void;
  submitting?: boolean;
  error?: string | null;
}

export function ReviewStep({
  email,
  shippingAddress,
  billingAddress,
  shippingRate,
  onEdit,
  onPlaceOrder,
  submitting,
  error,
}: Props) {
  return (
    <Stack gap={4}>
      <Card>
        <CardBody>
          <Cluster justify="between" align="start">
            <Stack gap={1}>
              <Heading level={4}>Contact</Heading>
              <Text size="sm">{email}</Text>
            </Stack>
            <Button variant="ghost" size="sm" onClick={() => onEdit('address')}>
              Edit
            </Button>
          </Cluster>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Cluster justify="between" align="start">
            <Stack gap={1}>
              <Heading level={4}>Ship to</Heading>
              <FormattedAddress value={shippingAddress} />
            </Stack>
            <Button variant="ghost" size="sm" onClick={() => onEdit('address')}>
              Edit
            </Button>
          </Cluster>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Cluster justify="between" align="start">
            <Stack gap={1}>
              <Heading level={4}>Bill to</Heading>
              <FormattedAddress value={billingAddress} />
            </Stack>
            <Button variant="ghost" size="sm" onClick={() => onEdit('address')}>
              Edit
            </Button>
          </Cluster>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Cluster justify="between" align="start">
            <Stack gap={1}>
              <Heading level={4}>Shipping method</Heading>
              <Text size="sm">
                {shippingRate.service} · {shippingRate.estimatedDaysMin}–
                {shippingRate.estimatedDaysMax} working days
              </Text>
            </Stack>
            <Button variant="ghost" size="sm" onClick={() => onEdit('shipping')}>
              Edit
            </Button>
          </Cluster>
        </CardBody>
      </Card>

      {error && <Alert variant="error">{error}</Alert>}

      <Button size="lg" loading={!!submitting} onClick={onPlaceOrder}>
        Place order
      </Button>
    </Stack>
  );
}

function FormattedAddress({ value }: { value: AddressValue }) {
  return (
    <Stack gap={0}>
      <Text size="sm">
        {value.firstName} {value.lastName}
      </Text>
      <Text size="sm">{value.line1}</Text>
      {value.line2 && <Text size="sm">{value.line2}</Text>}
      <Text size="sm">
        {value.city}
        {value.region ? `, ${value.region}` : ''} {value.postcode}
      </Text>
      <Text size="sm">{value.countryCode}</Text>
      {value.phone && (
        <Text size="sm" tone="muted">
          {value.phone}
        </Text>
      )}
    </Stack>
  );
}
