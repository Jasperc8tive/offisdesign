import Link from 'next/link';
import { Alert, Stack } from '@offisdesign/ui';

export default function AdminNotFound() {
  return (
    <Stack gap={4} className="p-6">
      <Alert variant="info" title="Not found">
        <Stack gap={3}>
          <span>That page doesn&apos;t exist, or you don&apos;t have access to it.</span>
          <Link href="/" className="text-link underline">
            Back to dashboard →
          </Link>
        </Stack>
      </Alert>
    </Stack>
  );
}
