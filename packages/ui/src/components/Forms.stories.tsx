import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select } from './Select';
import { Checkbox } from './Checkbox';
import { Radio } from './Radio';
import { Switch } from './Switch';
import { FormField } from './FormField';
import { Stack } from '../layout/Stack';

const meta: Meta = { title: 'Components/Forms' };
export default meta;
type Story = StoryObj;

export const Inputs: Story = {
  render: () => (
    <Stack gap={4} className="max-w-md p-8">
      <FormField label="Full name" htmlFor="name" required helperText="As shown on your card.">
        <Input id="name" placeholder="Jane Doe" />
      </FormField>
      <FormField label="Search" htmlFor="q">
        <Input
          id="q"
          placeholder="Search products…"
          leadingIcon={<Search width={16} height={16} aria-hidden />}
        />
      </FormField>
      <FormField label="Email" htmlFor="email" errorText="Enter a valid email.">
        <Input id="email" invalid value="not-an-email" onChange={() => undefined} />
      </FormField>
    </Stack>
  ),
};

export const TextareaExample: Story = {
  render: () => (
    <div className="max-w-md p-8">
      <FormField label="Notes" htmlFor="notes" helperText="Anything we should know?">
        <Textarea id="notes" placeholder="Add any delivery notes…" />
      </FormField>
    </div>
  ),
};

export const SelectExample: Story = {
  render: () => (
    <div className="max-w-md p-8">
      <FormField label="Country" htmlFor="country" required>
        <Select id="country" defaultValue="NG">
          <option value="NG">Nigeria</option>
          <option value="GH">Ghana</option>
          <option value="ZA">South Africa</option>
        </Select>
      </FormField>
    </div>
  ),
};

export const Choice: Story = {
  render: () => {
    const [news, setNews] = useState(true);
    const [shipping, setShipping] = useState('standard');
    return (
      <Stack gap={4} className="p-8">
        <Checkbox label="Subscribe to newsletter" defaultChecked />
        <div role="radiogroup" aria-label="Shipping" className="flex flex-col gap-2">
          <Radio
            label="Standard (3–5 days)"
            name="shipping"
            value="standard"
            checked={shipping === 'standard'}
            onChange={(e) => setShipping(e.target.value)}
          />
          <Radio
            label="Express (1–2 days)"
            name="shipping"
            value="express"
            checked={shipping === 'express'}
            onChange={(e) => setShipping(e.target.value)}
          />
        </div>
        <Switch checked={news} onCheckedChange={setNews} label="Email me about restocks" />
      </Stack>
    );
  },
};
