'use client';

import { useState } from 'react';
import { Alert, Button, Card, Cluster, PriceTag, Radio, Stack, Text } from '@offisdesign/ui';
import type { ShippingRate } from '../../lib/api/schemas';

interface Props {
  rates: ShippingRate[] | undefined;
  isLoading: boolean;
  isError: boolean;
  initialRateId?: string;
  onContinue: (rate: ShippingRate) => void;
  submitting?: boolean;
}

export function ShippingMethodStep({
  rates,
  isLoading,
  isError,
  initialRateId,
  onContinue,
  submitting,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | undefined>(initialRateId);

  if (isLoading) return <Text tone="muted">Loading shipping options…</Text>;
  if (isError) return <Alert variant="error">Could not load shipping options.</Alert>;
  if (!rates || rates.length === 0)
    return <Alert variant="warning">No shipping options available for this address.</Alert>;

  const active = rates.find((r) => r.id === selectedId) ?? rates[0];

  return (
    <Stack gap={4}>
      <div role="radiogroup" aria-label="Shipping method">
        <Stack gap={2}>
          {rates.map((rate) => (
            <Card key={rate.id} className="p-4">
              <Radio
                name="shipping"
                value={rate.id}
                checked={(active?.id ?? '') === rate.id}
                onChange={() => setSelectedId(rate.id)}
                label={
                  <Cluster justify="between" align="center" className="w-full">
                    <Stack gap={0}>
                      <Text className="text-secondary font-semibold">{rate.service}</Text>
                      <Text size="sm" tone="muted">
                        {rate.estimatedDaysMin}–{rate.estimatedDaysMax} working days
                      </Text>
                    </Stack>
                    {rate.amount === 0 ? (
                      <Text className="font-semibold">Free</Text>
                    ) : (
                      <PriceTag amount={rate.amount} currency={rate.currency} />
                    )}
                  </Cluster>
                }
              />
            </Card>
          ))}
        </Stack>
      </div>
      <Button
        onClick={() => active && onContinue(active)}
        loading={!!submitting}
        disabled={!active}
      >
        Continue to payment
      </Button>
    </Stack>
  );
}
