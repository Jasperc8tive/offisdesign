'use client';

import { useState } from 'react';
import {
  AspectRatio,
  Badge,
  Breadcrumb,
  Card,
  CardBody,
  Checkbox,
  Cluster,
  FormField,
  Grid,
  Heading,
  Label,
  Pagination,
  PriceTag,
  Rating,
  Select,
  Stack,
  Tag,
  Text,
} from '@offisdesign/ui';

const products = Array.from({ length: 9 }).map((_, i) => ({
  id: i,
  name: `Branch sofa style ${i + 1}`,
  price: 99900 + i * 5000,
  original: i % 3 === 0 ? 129900 + i * 5000 : undefined,
  rating: 4 + (i % 2) * 0.5,
  reviews: 24 + i * 3,
  badge: i === 1 ? 'New' : i === 4 ? 'Sale' : undefined,
}));

export default function CollectionPrototype() {
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<string[]>(['Oak', '£500 – £1500']);
  return (
    <Stack gap={6}>
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '#' }, { label: 'Sofas' }]}
      />
      <Stack gap={2}>
        <Heading level={1}>Sofas</Heading>
        <Text tone="muted">62 pieces designed and built in Britain.</Text>
      </Stack>
      <Cluster gap={2}>
        {activeFilters.map((f) => (
          <Tag key={f} onRemove={() => setActiveFilters((xs) => xs.filter((x) => x !== f))}>
            {f}
          </Tag>
        ))}
        {activeFilters.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveFilters([])}
            className="font-body text-body-sm text-primary underline-offset-4 hover:underline"
          >
            Clear all
          </button>
        )}
      </Cluster>
      <Grid cols={4} gap={6}>
        <aside className="lg:col-span-1">
          <Stack gap={4}>
            <Stack gap={2}>
              <Label>Material</Label>
              <Stack gap={1}>
                <Checkbox label="Oak" defaultChecked />
                <Checkbox label="Walnut" />
                <Checkbox label="Ash" />
                <Checkbox label="Linen" />
              </Stack>
            </Stack>
            <Stack gap={2}>
              <Label>Price</Label>
              <Stack gap={1}>
                <Checkbox label="Under £500" />
                <Checkbox label="£500 – £1500" defaultChecked />
                <Checkbox label="£1500+" />
              </Stack>
            </Stack>
          </Stack>
        </aside>
        <section className="lg:col-span-3" aria-label="Products">
          <Cluster justify="between" align="center" className="mb-4">
            <Text size="sm" tone="muted">
              Showing 9 of 62
            </Text>
            <FormField label="Sort" htmlFor="sort" className="flex-row items-center gap-3">
              <Select id="sort" defaultValue="featured">
                <option value="featured">Featured</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
                <option value="new">Newest</option>
              </Select>
            </FormField>
          </Cluster>
          <Grid cols={3} gap={4}>
            {products.map((p) => (
              <Card key={p.id} interactive tabIndex={0}>
                <div className="relative">
                  <AspectRatio ratio={1} className="bg-primary-subtle rounded-t-md" />
                  {p.badge && (
                    <span className="absolute left-3 top-3">
                      <Badge variant={p.badge === 'Sale' ? 'primary' : 'muted'}>{p.badge}</Badge>
                    </span>
                  )}
                </div>
                <CardBody>
                  <Stack gap={1}>
                    <Text className="text-secondary font-semibold">{p.name}</Text>
                    <PriceTag amount={p.price} originalAmount={p.original} size="sm" />
                    <Rating value={p.rating} reviewCount={p.reviews} size="sm" />
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </Grid>
          <div className="mt-8 flex justify-center">
            <Pagination page={page} pageCount={7} onPageChange={setPage} />
          </div>
        </section>
      </Grid>
    </Stack>
  );
}
