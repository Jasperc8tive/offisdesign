'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  Checkbox,
  FormField,
  Grid,
  Heading,
  Input,
  Stack,
} from '@offisdesign/ui';
import { useAuth, toast } from '../../../../lib/providers';
import { useUpdateProfile } from '../../../../lib/hooks';
import { ApiError } from '../../../../lib/api/errors';

export default function ProfilePage() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [marketingOptIn, setMarketingOptIn] = useState(user?.marketingOptIn ?? false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateProfile.mutateAsync({
        firstName,
        lastName,
        phone: phone || null,
        marketingOptIn,
      });
      toast.success('Profile saved');
    } catch (err) {
      setError(ApiError.is(err) ? err.message : (err as Error).message);
    }
  }

  return (
    <Stack gap={4}>
      <Heading level={2}>Profile</Heading>
      <Card>
        <CardBody>
          <form onSubmit={submit}>
            <Stack gap={4}>
              {error && <Alert variant="error">{error}</Alert>}
              <Grid cols={2} gap={3}>
                <FormField label="First name" htmlFor="fn">
                  <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </FormField>
                <FormField label="Last name" htmlFor="ln">
                  <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </FormField>
              </Grid>
              <FormField label="Email" htmlFor="em">
                <Input id="em" value={user.email} readOnly disabled />
              </FormField>
              <FormField label="Phone" htmlFor="ph">
                <Input
                  id="ph"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </FormField>
              <Checkbox
                label="Email me with offers and product news"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
              />
              <Button type="submit" loading={updateProfile.isPending}>
                Save changes
              </Button>
            </Stack>
          </form>
        </CardBody>
      </Card>
    </Stack>
  );
}
