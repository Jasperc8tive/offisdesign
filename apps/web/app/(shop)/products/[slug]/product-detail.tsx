'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Cluster,
  Grid,
  Heading,
  PriceTag,
  Quantity,
  Rating,
  Skeleton,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
} from '@offisdesign/ui';
import { useProduct } from '../../../../lib/hooks';
import { toast, useAnalytics, useCart, useRecentlyViewed } from '../../../../lib/providers';
import { EmptyResult } from '../../../../lib/ux/async-boundary';
import { Gallery } from '../../../../components/pdp/gallery';
import { VariantPicker } from '../../../../components/pdp/variant-picker';
import { RelatedProducts } from '../../../../components/pdp/related-products';
import { RecentlyViewedStrip } from '../../../../components/pdp/recently-viewed-strip';
import { WishlistButton } from '../../../../components/pdp/wishlist-button';
import { ProductRecommendations } from '../../../../components/pdp/product-recommendations';
import { ReviewsSection } from '../../../../components/pdp/reviews-section';
import { InventoryBadge } from '../../../../components/pdp/inventory-badge';
import { useReviewSummary } from '../../../../lib/hooks';
import { JsonLd } from '../../../../components/seo/json-ld';
import { breadcrumbJsonLd, productJsonLd } from '../../../../components/seo/schemas';

export function ProductDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const { data, isLoading, isError } = useProduct(slug);
  const reviewSummary = useReviewSummary(data?.id);
  const { addItem } = useCart();
  const { track } = useAnalytics();
  const recently = useRecentlyViewed();
  const [variantId, setVariantId] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!data) return;
    recently.track({ productId: data.id, slug: data.slug, name: data.name });
    track('page_view', { path: `/products/${data.slug}`, title: data.name });
    // recently.track + track are stable; we want this once per product id.
  }, [data?.id]);

  if (isLoading) {
    return (
      <Grid cols={2} gap={8}>
        <Skeleton className="aspect-[4/5]" rounded="md" />
        <Stack gap={3}>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </Stack>
      </Grid>
    );
  }
  if (isError || !data) {
    return <EmptyResult title="Product not found" description="It may have been removed." />;
  }

  const activeVariant = data.variants.find((v) => v.id === variantId) ?? data.variants[0];
  if (!activeVariant) {
    return (
      <EmptyResult title="No variants" description="This product is not currently for sale." />
    );
  }

  const focalCollection = data.collections[0]?.collection.slug;
  const breadcrumbs: Array<{ label: string; href?: string }> = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/search' },
    ...(focalCollection
      ? [
          {
            label: data.collections[0]!.collection.name,
            href: `/collections/${focalCollection}`,
          },
        ]
      : []),
    { label: data.name },
  ];

  const productName = data.name;
  async function onAdd() {
    if (!activeVariant) return;
    setAdding(true);
    try {
      await addItem({ variantId: activeVariant.id, quantity });
      track('cart_item_added', { variantId: activeVariant.id, productSlug: slug });
      toast.success(`Added ${productName} to bag`);
      router.push('/cart');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <Stack gap={12}>
      <JsonLd
        payload={[
          breadcrumbJsonLd(
            breadcrumbs.map((b) => ({ label: b.label, href: b.href ?? `/products/${slug}` })),
          ),
          productJsonLd({
            name: data.name,
            slug: data.slug,
            description: data.description,
            brand: data.brand,
            priceAmount: activeVariant.priceAmount,
            priceCurrency: activeVariant.priceCurrency,
            availability: 'InStock',
            sku: activeVariant.sku,
          }),
        ]}
      />
      <Breadcrumb items={breadcrumbs} />

      <Grid cols={2} gap={8}>
        <Gallery images={data.media.map((m) => ({ id: m.id, alt: m.alt ?? data.name }))} />

        <Stack gap={4}>
          <Cluster gap={2}>
            <InventoryBadge variantId={activeVariant.id} />
            {activeVariant.compareAtAmount &&
              activeVariant.compareAtAmount > activeVariant.priceAmount && (
                <Badge variant="muted">Sale</Badge>
              )}
          </Cluster>
          <Heading level={1}>{data.name}</Heading>
          {data.brand && (
            <Text size="sm" tone="muted">
              {data.brand}
            </Text>
          )}
          <Rating
            value={reviewSummary.data?.average ?? 0}
            reviewCount={reviewSummary.data?.count ?? 0}
          />
          <PriceTag
            amount={activeVariant.priceAmount}
            currency={activeVariant.priceCurrency}
            {...(activeVariant.compareAtAmount
              ? { originalAmount: activeVariant.compareAtAmount }
              : {})}
            size="lg"
          />
          {data.description && <Text tone="muted">{data.description}</Text>}

          {data.variants.length > 1 && (
            <VariantPicker
              product={data}
              activeVariantId={activeVariant.id}
              onChange={setVariantId}
            />
          )}

          <Stack gap={2}>
            <Text className="text-secondary font-semibold">Quantity</Text>
            <Cluster gap={3} align="center">
              <Quantity value={quantity} onChange={setQuantity} />
              <WishlistButton productId={data.id} slug={data.slug} name={data.name} />
            </Cluster>
          </Stack>

          <Button
            size="lg"
            fullWidth
            loading={adding}
            onClick={onAdd}
            leadingIcon={<ShoppingBag width={18} height={18} aria-hidden />}
          >
            Add to bag
          </Button>

          <Alert variant="info" title="Delivery 3–5 weeks">
            Free UK delivery on orders over £500.
          </Alert>
        </Stack>
      </Grid>

      <Tabs defaultValue="details">
        <TabList label="Product info">
          <Tab value="details">Details</Tab>
          <Tab value="materials">Materials</Tab>
          <Tab value="delivery">Delivery</Tab>
          <Tab value="reviews">Reviews</Tab>
        </TabList>
        <TabPanel value="details">
          <Text>{data.description ?? '—'}</Text>
        </TabPanel>
        <TabPanel value="materials">
          <Text tone="muted">
            {data.tags.length > 0
              ? data.tags.map((t) => t.tag.name).join(', ')
              : 'Materials information coming soon.'}
          </Text>
        </TabPanel>
        <TabPanel value="delivery">
          <Text>3–5 weeks to UK mainland. White-glove room of choice available.</Text>
        </TabPanel>
        <TabPanel value="reviews">
          <ReviewsSection productId={data.id} />
        </TabPanel>
      </Tabs>

      <ProductRecommendations
        title="Frequently bought together"
        kind="CROSS_SELL"
        links={data.linksFrom}
        location="pdp_cross_sell"
      />
      <ProductRecommendations
        title="Upgrade your pick"
        kind="UP_SELL"
        links={data.linksFrom}
        location="pdp_up_sell"
      />
      <ProductRecommendations
        title="Related pieces"
        kind="RELATED"
        links={data.linksFrom}
        location="pdp_related_curated"
      />

      <RelatedProducts
        title="You may also like"
        {...(focalCollection ? { collection: focalCollection } : {})}
        excludeProductId={data.id}
      />

      <RecentlyViewedStrip excludeProductId={data.id} />
    </Stack>
  );
}
