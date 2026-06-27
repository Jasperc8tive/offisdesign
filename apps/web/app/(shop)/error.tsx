'use client';

import { useEffect } from 'react';
import { Alert, Button, Stack } from '@offisdesign/ui';
import { reportError } from '../../lib/observability/error-reporter';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ShopError({ error, reset }: Props) {
  useEffect(() => {
    reportError(error, {
      tags: { boundary: 'route', segment: 'shop' },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <Stack gap={4} className="py-12">
      <Alert variant="error" title="We hit a snag">
        <Stack gap={3}>
          <span>{error.message || 'An unexpected error occurred.'}</span>
          {error.digest && (
            <span className="text-caption text-muted block">ref: {error.digest}</span>
          )}
          <div>
            <Button size="sm" onClick={reset}>
              Try again
            </Button>
          </div>
        </Stack>
      </Alert>
    </Stack>
  );
}
