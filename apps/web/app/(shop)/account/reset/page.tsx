'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Alert, Button, FormField, Heading, Input, Stack, Text } from '@offisdesign/ui';
import { useCompletePasswordReset, useRequestPasswordReset } from '../../../../lib/hooks';

function RequestReset() {
  const request = useRequestPasswordReset();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await request.mutateAsync(email);
    setSent(true);
  }

  if (sent) {
    return (
      <Alert variant="info" title="Check your inbox">
        If an account exists for {email}, we&rsquo;ve sent a reset link.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <Stack gap={4}>
        <FormField label="Email" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>
        <Button type="submit" loading={request.isPending}>
          Send reset link
        </Button>
      </Stack>
    </form>
  );
}

function CompleteReset({ token }: { token: string }) {
  const complete = useCompletePasswordReset();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await complete.mutateAsync({ token, password });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (done) {
    return (
      <>
        <Alert variant="success" title="Password updated">
          Sign in with your new password.
        </Alert>
        <Link href="/account/login">
          <Button>Continue to sign in</Button>
        </Link>
      </>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <Stack gap={4}>
        {error && <Alert variant="error">{error}</Alert>}
        <FormField label="New password" htmlFor="pw" required helperText="At least 8 characters.">
          <Input
            id="pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </FormField>
        <Button type="submit" loading={complete.isPending}>
          Update password
        </Button>
      </Stack>
    </form>
  );
}

function ResetContent() {
  const token = useSearchParams().get('token');
  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <Heading level={1}>Reset password</Heading>
        <Text tone="muted">
          {token ? 'Choose a new password.' : "We'll email you a reset link."}
        </Text>
      </Stack>
      {token ? <CompleteReset token={token} /> : <RequestReset />}
    </Stack>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetContent />
    </Suspense>
  );
}
