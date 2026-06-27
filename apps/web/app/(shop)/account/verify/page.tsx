'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Alert, Button, Heading, Spinner, Stack, Text } from '@offisdesign/ui';
import { useVerifyEmail } from '../../../../lib/hooks';

function VerifyContent() {
  const token = useSearchParams().get('token') ?? '';
  const verify = useVerifyEmail();
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token in the URL.');
      return;
    }
    setStatus('pending');
    verify
      .mutateAsync(token)
      .then(() => setStatus('success'))
      .catch((err: Error) => {
        setStatus('error');
        setMessage(err.message);
      });
  }, [token]); // verify mutation handle is stable across renders

  return (
    <Stack gap={6} className="mx-auto max-w-md">
      <Heading level={1}>Verify email</Heading>
      {status === 'pending' && (
        <Stack gap={3}>
          <Spinner />
          <Text tone="muted">Verifying your email…</Text>
        </Stack>
      )}
      {status === 'success' && (
        <>
          <Alert variant="success" title="Email verified">
            Your account is ready. Sign in to continue.
          </Alert>
          <Link href="/account/login">
            <Button>Continue to sign in</Button>
          </Link>
        </>
      )}
      {status === 'error' && (
        <Alert variant="error" title="Verification failed">
          {message}
        </Alert>
      )}
    </Stack>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <VerifyContent />
    </Suspense>
  );
}
