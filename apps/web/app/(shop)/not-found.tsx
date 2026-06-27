import Link from 'next/link';
import { Button, EmptyState } from '@offisdesign/ui';

export default function ShopNotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you’re looking for doesn’t exist or has moved."
      action={
        <Link href="/">
          <Button>Back to home</Button>
        </Link>
      }
    />
  );
}
