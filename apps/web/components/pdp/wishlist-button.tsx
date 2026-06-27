'use client';

import { Heart } from 'lucide-react';
import { Button, Icon, Tooltip } from '@offisdesign/ui';
import { useWishlist } from '../../lib/providers';

interface Props {
  productId: string;
  slug: string;
  name: string;
}

export function WishlistButton({ productId, slug, name }: Props) {
  const { has, toggle } = useWishlist();
  const inList = has(productId);
  return (
    <Tooltip content={inList ? 'Remove from wishlist' : 'Save to wishlist'}>
      <Button
        variant={inList ? 'primary' : 'outline'}
        aria-pressed={inList}
        aria-label={inList ? 'Remove from wishlist' : 'Save to wishlist'}
        onClick={() => {
          void toggle({ productId, slug, name });
        }}
      >
        <Icon icon={Heart} decorative />
      </Button>
    </Tooltip>
  );
}
