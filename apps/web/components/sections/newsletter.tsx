'use client';

import { useState } from 'react';
import { Alert, Button, Container, Display, FormField, Input, Stack, Text } from '@offisdesign/ui';
import { useSubscribeNewsletter } from '../../lib/hooks';
import { useAnalytics } from '../../lib/providers';
import { ApiError } from '../../lib/api/errors';

interface Props {
  source?: string;
  title?: string;
  lead?: string;
}

export function Newsletter({
  source = 'homepage_footer',
  title = 'Sign up for new arrivals.',
  lead = 'One email a month — collections, journal posts, no spam.',
}: Props) {
  const subscribe = useSubscribeNewsletter();
  const { track } = useAnalytics();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await subscribe.mutateAsync({ email, source });
      setDone(true);
      track('newsletter_subscribed', { source });
    } catch (err) {
      if (ApiError.is(err) && err.code === 'ALREADY_SUBSCRIBED') {
        setError('You are already subscribed.');
        track('newsletter_subscribe_failed', { source, code: err.code });
      } else if (ApiError.is(err)) {
        setError(err.message);
        track('newsletter_subscribe_failed', { source, code: err.code });
      } else {
        setError((err as Error).message);
        track('newsletter_subscribe_failed', { source, code: 'UNKNOWN' });
      }
    }
  }

  return (
    <section className="bg-primary-subtle">
      <Container className="py-12">
        <Stack gap={4} align="center" className="text-center">
          <Display size="sm">{title}</Display>
          <Text tone="muted" className="max-w-prose">
            {lead}
          </Text>
          {done ? (
            <Alert variant="success" title="Thanks for subscribing">
              Look out for our next dispatch.
            </Alert>
          ) : (
            <form onSubmit={onSubmit} className="w-full max-w-md">
              <Stack gap={3}>
                {error && <Alert variant="error">{error}</Alert>}
                <FormField label="Email" htmlFor="nl-email" required>
                  <Input
                    id="nl-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </FormField>
                <Button type="submit" loading={subscribe.isPending} fullWidth>
                  Subscribe
                </Button>
                <Text size="sm" tone="muted">
                  We&rsquo;ll never share your email.
                </Text>
              </Stack>
            </form>
          )}
        </Stack>
      </Container>
    </section>
  );
}
