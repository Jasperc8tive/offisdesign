'use client';

import { use } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Cluster,
  Heading,
  Stack,
  Text,
} from '@offisdesign/ui';
import { Can } from '../../../../components/rbac';
import { catalogService } from '../../../../lib/api/services';
import { toast } from '../../../../lib/providers';
import { formatMoney } from '../../../../lib/format';
import { ApiError } from '../../../../lib/api/errors';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const products = useQuery({
    queryKey: ['admin', 'products', id],
    queryFn: () => catalogService.listProducts({ pageSize: 50 }),
  });
  const product = products.data?.data.find((p) => p.id === id);

  const publish = useMutation({
    mutationFn: () => catalogService.publishProduct(id),
    onSuccess: () => {
      toast.success('Product published');
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (err) => toast.error(ApiError.is(err) ? err.message : (err as Error).message),
  });
  const archive = useMutation({
    mutationFn: () => catalogService.archiveProduct(id),
    onSuccess: () => {
      toast.success('Product archived');
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
  const remove = useMutation({
    mutationFn: () => catalogService.deleteProduct(id),
    onSuccess: () => {
      toast.success('Product deleted');
      router.replace('/catalog/products');
    },
  });

  if (products.isLoading) return <Text tone="muted">Loading…</Text>;
  if (!product) return <Alert variant="error">Product not found.</Alert>;

  return (
    <Stack gap={6}>
      <Cluster justify="between" align="center">
        <Stack gap={1}>
          <Heading level={1}>{product.name}</Heading>
          <Cluster gap={2} align="center">
            <Badge variant="muted">{product.status}</Badge>
            <Text size="sm" tone="muted">
              {product.slug}
            </Text>
          </Cluster>
        </Stack>
        <Cluster gap={2}>
          <Can any={['catalog:write']}>
            {product.status !== 'ACTIVE' && (
              <Button onClick={() => publish.mutate()} loading={publish.isPending}>
                Publish
              </Button>
            )}
            {product.status === 'ACTIVE' && (
              <Button
                variant="outline"
                onClick={() => archive.mutate()}
                loading={archive.isPending}
              >
                Archive
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                if (confirm('Delete this product? Soft-deletes via the API.')) remove.mutate();
              }}
              loading={remove.isPending}
            >
              Delete
            </Button>
          </Can>
        </Cluster>
      </Cluster>

      <Card>
        <CardBody>
          <Stack gap={3}>
            <Heading level={4}>Variants</Heading>
            {product.variants.length === 0 ? (
              <Text tone="muted">No variants yet.</Text>
            ) : (
              <Stack gap={2}>
                {product.variants.map((v) => (
                  <Cluster key={v.id} justify="between" align="center">
                    <Stack gap={0}>
                      <Text size="sm" className="font-semibold">
                        {v.sku}
                      </Text>
                    </Stack>
                    <Text size="sm">{formatMoney(v.priceAmount, v.priceCurrency)}</Text>
                  </Cluster>
                ))}
              </Stack>
            )}
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}
