'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Button,
  Card,
  CardBody,
  FormField,
  Heading,
  Input,
  Stack,
  Text,
} from '@offisdesign/ui';
import { ApiError } from '../../lib/api/errors';
import { useAuth } from '../../lib/providers';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params?.get('next') ?? '/';
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace(next);
  }, [isAuthenticated, isLoading, next, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      router.replace(next);
    } catch (err) {
      setError(ApiError.is(err) ? err.message : (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-canvas flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardBody>
          <Stack gap={4}>
            <Stack gap={1}>
              <Heading level={2}>Sign in to Admin</Heading>
              <Text tone="muted">Use your Offisdesign staff credentials.</Text>
            </Stack>
            <form onSubmit={submit}>
              <Stack gap={4}>
                {error && <Alert variant="error">{error}</Alert>}
                <FormField label="Email" htmlFor="em" required>
                  <Input
                    id="em"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </FormField>
                <FormField label="Password" htmlFor="pw" required>
                  <Input
                    id="pw"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </FormField>
                <Button type="submit" loading={submitting} fullWidth>
                  Sign in
                </Button>
              </Stack>
            </form>
          </Stack>
        </CardBody>
      </Card>
    </main>
  );
}
