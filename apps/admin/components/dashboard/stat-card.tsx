'use client';

import { Card, CardBody, Heading, Skeleton, Stack, Text } from '@offisdesign/ui';

interface Props {
  title: string;
  value: React.ReactNode;
  /** Optional supporting metric ("12 this week", "↓ 4% vs last month"). */
  hint?: React.ReactNode;
  loading?: boolean;
}

export function StatCard({ title, value, hint, loading }: Props) {
  return (
    <Card>
      <CardBody>
        <Stack gap={2}>
          <Text size="sm" tone="muted">
            {title}
          </Text>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <Heading level={2} className="text-secondary">
              {value}
            </Heading>
          )}
          {hint && (
            <Text size="sm" tone="muted">
              {hint}
            </Text>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
}
