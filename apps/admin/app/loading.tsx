import { Stack } from '@offisdesign/ui';

export default function AdminLoading() {
  return (
    <Stack gap={3} className="p-6" aria-busy="true" aria-live="polite">
      <div className="bg-muted/40 h-6 w-48 animate-pulse rounded" />
      <div className="bg-muted/40 h-32 w-full animate-pulse rounded" />
      <div className="bg-muted/40 h-32 w-full animate-pulse rounded" />
    </Stack>
  );
}
