'use client';

import { useState } from 'react';
import { Button, Checkbox, FormField, Grid, Input, Select, Stack } from '@offisdesign/ui';

export interface AddressValue {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postcode: string;
  countryCode: string;
  phone?: string;
}

interface Props {
  initial?: Partial<AddressValue>;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (value: AddressValue) => void | Promise<void>;
  /** Optional "billing same as shipping" toggle. */
  sameAsShippingValue?: boolean;
  onSameAsShippingChange?: (next: boolean) => void;
}

export function AddressForm({
  initial,
  submitting,
  submitLabel = 'Continue',
  onSubmit,
  sameAsShippingValue,
  onSameAsShippingChange,
}: Props) {
  const [value, setValue] = useState<AddressValue>({
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    line1: initial?.line1 ?? '',
    line2: initial?.line2 ?? '',
    city: initial?.city ?? '',
    region: initial?.region ?? '',
    postcode: initial?.postcode ?? '',
    countryCode: initial?.countryCode ?? 'GB',
    phone: initial?.phone ?? '',
  });

  function set<K extends keyof AddressValue>(key: K, v: AddressValue[K]) {
    setValue((prev) => ({ ...prev, [key]: v }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(value);
      }}
    >
      <Stack gap={4}>
        <Grid cols={2} gap={3}>
          <FormField label="First name" htmlFor="fn" required>
            <Input
              id="fn"
              value={value.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              required
            />
          </FormField>
          <FormField label="Last name" htmlFor="ln" required>
            <Input
              id="ln"
              value={value.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              required
            />
          </FormField>
        </Grid>
        <FormField label="Address line 1" htmlFor="line1" required>
          <Input
            id="line1"
            value={value.line1}
            onChange={(e) => set('line1', e.target.value)}
            required
          />
        </FormField>
        <FormField label="Address line 2" htmlFor="line2">
          <Input
            id="line2"
            value={value.line2 ?? ''}
            onChange={(e) => set('line2', e.target.value)}
          />
        </FormField>
        <Grid cols={3} gap={3}>
          <FormField label="City" htmlFor="city" required>
            <Input
              id="city"
              value={value.city}
              onChange={(e) => set('city', e.target.value)}
              required
            />
          </FormField>
          <FormField label="Region" htmlFor="region">
            <Input
              id="region"
              value={value.region ?? ''}
              onChange={(e) => set('region', e.target.value)}
            />
          </FormField>
          <FormField label="Postcode" htmlFor="postcode" required>
            <Input
              id="postcode"
              value={value.postcode}
              onChange={(e) => set('postcode', e.target.value)}
              required
            />
          </FormField>
        </Grid>
        <Grid cols={2} gap={3}>
          <FormField label="Country" htmlFor="country" required>
            <Select
              id="country"
              value={value.countryCode}
              onChange={(e) => set('countryCode', e.target.value)}
            >
              <option value="GB">United Kingdom</option>
              <option value="IE">Ireland</option>
              <option value="FR">France</option>
              <option value="DE">Germany</option>
              <option value="ES">Spain</option>
              <option value="NL">Netherlands</option>
            </Select>
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <Input
              id="phone"
              type="tel"
              value={value.phone ?? ''}
              onChange={(e) => set('phone', e.target.value)}
            />
          </FormField>
        </Grid>
        {onSameAsShippingChange && (
          <Checkbox
            label="Billing address is the same as shipping"
            checked={sameAsShippingValue ?? true}
            onChange={(e) => onSameAsShippingChange(e.target.checked)}
          />
        )}
        <Button type="submit" loading={!!submitting}>
          {submitLabel}
        </Button>
      </Stack>
    </form>
  );
}
