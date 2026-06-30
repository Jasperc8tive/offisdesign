'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  Container,
  Display,
  FormField,
  Input,
  PageSection,
  Stack,
  Text,
} from '@offisdesign/ui';
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
    <PageSection variant="bleed" padding="default" className="bg-surface">
      <Container>
        <Stack gap={6} align="center" className="text-center">
          <Stack gap={2} align="center">
            <Display size="sm">{title}</Display>
            <Text tone="muted" className="max-w-prose">
              {lead}
            </Text>
          </Stack>
          {done ? (
            <Alert variant="success" title="Thanks for subscribing">
              Look out for our next dispatch.
            </Alert>
          ) : (
            <form onSubmit={onSubmit} className="w-full max-w-md">
              <Stack gap={3}>
                {error && <Alert variant="error">{error}</Alert>}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex-1 text-left">
                    <FormField label="Email" htmlFor="nl-email" required>
                      <Input
                        id="nl-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </FormField>
                  </div>
                  <Button type="submit" size="lg" loading={subscribe.isPending} className="sm:mt-7">
                    Subscribe
                  </Button>
                </div>
                <Text size="sm" tone="muted">
                  We&rsquo;ll never share your email.
                </Text>
              </Stack>
            </form>
          )}
        </Stack>
      </Container>
    </PageSection>
  );
}
