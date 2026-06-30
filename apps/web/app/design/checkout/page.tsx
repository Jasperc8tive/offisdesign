'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  Checkbox,
  Cluster,
  Divider,
  FormField,
  Grid,
  Heading,
  Icon,
  Input,
  PriceTag,
  Progress,
  Radio,
  Select,
  Stack,
  Text,
} from '@offisdesign/ui';

export default function CheckoutPrototype() {
  const [shipping, setShipping] = useState('standard');
  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <Heading level={1}>Checkout</Heading>
        <Progress value={50} max={100} label="Checkout progress" />
        <Text size="sm" tone="muted">
          Step 2 of 4 — Shipping
        </Text>
      </Stack>

      <Grid cols={3} gap={8}>
        <section className="lg:col-span-2" aria-labelledby="contact">
          <Stack gap={6}>
            <Stack gap={3}>
              <Heading level={3} id="contact">
                Contact
              </Heading>
              <FormField label="Email" htmlFor="email" required>
                <Input id="email" type="email" defaultValue="jane@example.com" />
              </FormField>
              <Checkbox label="Email me about restocks and journal posts." defaultChecked />
            </Stack>

            <Stack gap={3}>
              <Heading level={3}>Delivery address</Heading>
              <Grid cols={2} gap={3}>
                <FormField label="First name" htmlFor="fn" required>
                  <Input id="fn" />
                </FormField>
                <FormField label="Last name" htmlFor="ln" required>
                  <Input id="ln" />
                </FormField>
              </Grid>
              <FormField label="Address" htmlFor="addr1" required>
                <Input id="addr1" />
              </FormField>
              <Grid cols={2} gap={3}>
                <FormField label="City" htmlFor="city" required>
                  <Input id="city" />
                </FormField>
                <FormField label="Postcode" htmlFor="pc" required>
                  <Input id="pc" />
                </FormField>
              </Grid>
              <FormField label="Country" htmlFor="country" required>
                <Select id="country" defaultValue="NG">
                  <option value="NG">Nigeria</option>
                </Select>
              </FormField>
            </Stack>

            <Stack gap={3}>
              <Heading level={3}>Shipping method</Heading>
              <div role="radiogroup" aria-label="Shipping method" className="flex flex-col gap-2">
                <Card className="cursor-pointer p-4">
                  <Radio
                    label={
                      <Cluster justify="between" align="center" className="w-full">
                        <Stack gap={0}>
                          <Text className="text-secondary font-semibold">Standard delivery</Text>
                          <Text size="sm" tone="muted">
                            3–5 working days
                          </Text>
                        </Stack>
                        <Text className="font-semibold">Free</Text>
                      </Cluster>
                    }
                    name="shipping"
                    value="standard"
                    checked={shipping === 'standard'}
                    onChange={(e) => setShipping(e.target.value)}
                  />
                </Card>
                <Card className="cursor-pointer p-4">
                  <Radio
                    label={
                      <Cluster justify="between" align="center" className="w-full">
                        <Stack gap={0}>
                          <Text className="text-secondary font-semibold">Express delivery</Text>
                          <Text size="sm" tone="muted">
                            1–2 working days
                          </Text>
                        </Stack>
                        <Text className="font-semibold">₦18,000</Text>
                      </Cluster>
                    }
                    name="shipping"
                    value="express"
                    checked={shipping === 'express'}
                    onChange={(e) => setShipping(e.target.value)}
                  />
                </Card>
              </div>
            </Stack>

            <Alert variant="info" title="Secure checkout">
              <Cluster gap={2} align="center">
                <Icon icon={Lock} size="sm" decorative />
                <Text size="sm">Your information is encrypted in transit.</Text>
              </Cluster>
            </Alert>
          </Stack>
        </section>

        <aside className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardBody>
              <Stack gap={4}>
                <Heading level={4}>Order summary</Heading>
                <Stack gap={3}>
                  <Cluster justify="between">
                    <Text size="sm">Aria task chair × 1</Text>
                    <PriceTag amount={18500000} size="sm" />
                  </Cluster>
                  <Cluster justify="between">
                    <Text size="sm">Guest chair × 2</Text>
                    <PriceTag amount={19000000} size="sm" />
                  </Cluster>
                </Stack>
                <Divider />
                <Stack gap={1}>
                  <Cluster justify="between">
                    <Text size="sm" tone="muted">
                      Subtotal
                    </Text>
                    <PriceTag amount={37500000} size="sm" />
                  </Cluster>
                  <Cluster justify="between">
                    <Text size="sm" tone="muted">
                      Shipping
                    </Text>
                    <Text size="sm">{shipping === 'standard' ? 'Free' : '₦18,000'}</Text>
                  </Cluster>
                </Stack>
                <Divider />
                <Cluster justify="between" align="center">
                  <Text className="text-secondary font-semibold">Total</Text>
                  <PriceTag amount={shipping === 'standard' ? 37500000 : 39300000} size="lg" />
                </Cluster>
                <Button size="lg" fullWidth>
                  Continue to payment
                </Button>
              </Stack>
            </CardBody>
          </Card>
        </aside>
      </Grid>
    </Stack>
  );
}
