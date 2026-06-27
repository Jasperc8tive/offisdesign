'use client';

import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Cluster,
  EmptyState,
  Heading,
  Stack,
  Text,
} from '@offisdesign/ui';
import { AddressForm, type AddressValue } from '../../../../components/checkout/address-form';
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useUpdateAddress,
} from '../../../../lib/hooks';
import { toast } from '../../../../lib/providers';
import { ApiError } from '../../../../lib/api/errors';
import type { Address } from '../../../../lib/api/schemas';

export default function AddressBookPage() {
  const { data, isLoading } = useAddresses();
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const remove = useDeleteAddress();
  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <Text tone="muted">Loading addresses…</Text>;

  async function save(value: AddressValue) {
    setError(null);
    try {
      if (editing === 'new') {
        await create.mutateAsync(value as unknown as Record<string, unknown>);
        toast.success('Address added');
      } else if (editing) {
        await update.mutateAsync({
          id: editing.id,
          input: value as unknown as Record<string, unknown>,
        });
        toast.success('Address updated');
      }
      setEditing(null);
    } catch (err) {
      setError(ApiError.is(err) ? err.message : (err as Error).message);
    }
  }

  if (editing) {
    const initial: Partial<AddressValue> | undefined =
      editing === 'new'
        ? undefined
        : {
            firstName: editing.firstName,
            lastName: editing.lastName,
            line1: editing.line1,
            line2: editing.line2 ?? '',
            city: editing.city,
            region: editing.region ?? '',
            postcode: editing.postcode,
            countryCode: editing.countryCode,
            phone: editing.phone ?? '',
          };
    return (
      <Stack gap={4}>
        <Heading level={2}>{editing === 'new' ? 'Add address' : 'Edit address'}</Heading>
        {error && <Alert variant="error">{error}</Alert>}
        <Card>
          <CardBody>
            <AddressForm
              {...(initial ? { initial } : {})}
              submitting={create.isPending || update.isPending}
              onSubmit={save}
              submitLabel="Save address"
            />
            <div className="mt-4">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </CardBody>
        </Card>
      </Stack>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No addresses saved"
        description="Add a delivery address for faster checkout."
        action={<Button onClick={() => setEditing('new')}>Add address</Button>}
      />
    );
  }

  return (
    <Stack gap={4}>
      <Cluster justify="between" align="center">
        <Heading level={2}>Address book</Heading>
        <Button onClick={() => setEditing('new')}>Add address</Button>
      </Cluster>
      <Stack gap={3}>
        {data.map((a) => (
          <Card key={a.id}>
            <CardBody>
              <Cluster justify="between" align="start">
                <Stack gap={1}>
                  <Cluster gap={2} align="center">
                    <Text className="text-secondary font-semibold">
                      {a.firstName} {a.lastName}
                    </Text>
                    {a.isDefault && <Badge variant="muted">Default</Badge>}
                  </Cluster>
                  <Text size="sm" tone="muted">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.postcode}, {a.countryCode}
                  </Text>
                  {a.phone && (
                    <Text size="sm" tone="muted">
                      {a.phone}
                    </Text>
                  )}
                </Stack>
                <Cluster gap={2}>
                  <Button variant="outline" size="sm" onClick={() => setEditing(a)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        await remove.mutateAsync(a.id);
                        toast.success('Address removed');
                      } catch (err) {
                        toast.error(ApiError.is(err) ? err.message : (err as Error).message);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </Cluster>
              </Cluster>
            </CardBody>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
