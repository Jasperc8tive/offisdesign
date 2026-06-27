'use client';

import { Card, CardBody, Grid, Stack, Text } from '@offisdesign/ui';
import { useTestimonials } from '../../lib/hooks';
import { SectionShell } from './section-shell';

export function TestimonialsStrip() {
  const { data, isLoading } = useTestimonials();
  if (isLoading) return null;
  if (!data || data.length === 0) return null;

  return (
    <SectionShell eyebrow="From customers" title="What people say.">
      <Grid cols={3} gap={4}>
        {data.slice(0, 3).map((t) => (
          <Card key={t.id}>
            <CardBody>
              <Stack gap={2}>
                <Text className="font-heading text-h4 text-secondary">“{t.quote}”</Text>
                <Text size="sm" tone="muted">
                  — {t.author}
                  {t.source ? `, ${t.source}` : ''}
                </Text>
              </Stack>
            </CardBody>
          </Card>
        ))}
      </Grid>
    </SectionShell>
  );
}
