'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Alert,
  Button,
  Checkbox,
  FormField,
  Grid,
  Heading,
  Input,
  Stack,
  Text,
} from '@offisdesign/ui';
import { useRegister } from '../../../../lib/hooks';
import { useAuth } from '../../../../lib/providers';
import { ApiError } from '../../../../lib/api/errors';

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    marketingOptIn: false,
  });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register.mutateAsync(form);
      // Auto sign-in after register so the customer lands authenticated.
      await login(form.email, form.password);
      router.push('/account');
    } catch (err) {
      if (ApiError.is(err) && err.status === 409) setError('Email already registered.');
      else setError((err as Error).message);
    }
  }

  return (
    <Stack gap={6} className="mx-auto max-w-md">
      <Stack gap={2}>
        <Heading level={1}>Create your account</Heading>
        <Text tone="muted">A quick sign-up — we&rsquo;ll send a verification email next.</Text>
      </Stack>
      {error && <Alert variant="error">{error}</Alert>}
      <form onSubmit={onSubmit}>
        <Stack gap={4}>
          <Grid cols={2} gap={3}>
            <FormField label="First name" htmlFor="fn">
              <Input
                id="fn"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </FormField>
            <FormField label="Last name" htmlFor="ln">
              <Input
                id="ln"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </FormField>
          </Grid>
          <FormField label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </FormField>
          <FormField
            label="Password"
            htmlFor="password"
            required
            helperText="At least 8 characters."
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required
            />
          </FormField>
          <Checkbox
            label="Email me about new collections and the journal"
            checked={form.marketingOptIn}
            onChange={(e) => setForm({ ...form, marketingOptIn: e.target.checked })}
          />
          <Button type="submit" fullWidth loading={register.isPending}>
            Create account
          </Button>
        </Stack>
      </form>
      <Text size="sm" tone="muted">
        Already have an account?{' '}
        <Link href="/account/login" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
        .
      </Text>
    </Stack>
  );
}
