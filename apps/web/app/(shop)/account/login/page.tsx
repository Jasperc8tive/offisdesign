'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, Button, FormField, Heading, Input, Stack, Text } from '@offisdesign/ui';
import { useAuth } from '../../../../lib/providers';
import { ApiError } from '../../../../lib/api/errors';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/account');
    } catch (err) {
      if (ApiError.is(err) && err.status === 401) setError('Invalid email or password.');
      else setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack gap={6} className="mx-auto max-w-md">
      <Stack gap={2}>
        <Heading level={1}>Sign in</Heading>
        <Text tone="muted">Welcome back. Sign in to your Offisdesign account.</Text>
      </Stack>
      {error && <Alert variant="error">{error}</Alert>}
      <form onSubmit={onSubmit}>
        <Stack gap={4}>
          <FormField label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Password" htmlFor="password" required>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormField>
          <Button type="submit" fullWidth loading={submitting}>
            Sign in
          </Button>
        </Stack>
      </form>
      <Stack gap={1}>
        <Text size="sm" tone="muted">
          New to Offisdesign?{' '}
          <Link
            href="/account/register"
            className="text-primary underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
          .
        </Text>
        <Text size="sm" tone="muted">
          Forgot password?{' '}
          <Link href="/account/reset" className="text-primary underline-offset-4 hover:underline">
            Reset it
          </Link>
          .
        </Text>
      </Stack>
    </Stack>
  );
}
