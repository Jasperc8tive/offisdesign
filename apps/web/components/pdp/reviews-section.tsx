'use client';

import { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Cluster,
  FormField,
  Heading,
  Input,
  Rating,
  Stack,
  Text,
  Textarea,
} from '@offisdesign/ui';
import { useReviews, useReviewSummary, useSubmitReview, useVoteHelpful } from '../../lib/hooks';
import { useAuth, toast } from '../../lib/providers';
import { ApiError } from '../../lib/api/errors';

interface Props {
  productId: string;
}

const PAGE_SIZE = 5;

export function ReviewsSection({ productId }: Props) {
  const [page, setPage] = useState(1);
  const summary = useReviewSummary(productId);
  const list = useReviews(productId, { page, pageSize: PAGE_SIZE });
  const submit = useSubmitReview();
  const vote = useVoteHelpful();
  const auth = useAuth();

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await submit.mutateAsync({
        productId,
        rating,
        ...(title.trim() ? { title: title.trim() } : {}),
        body: body.trim(),
      });
      toast.success('Thanks — your review is awaiting moderation.');
      setOpen(false);
      setTitle('');
      setBody('');
      setRating(5);
    } catch (err) {
      setError(ApiError.is(err) ? err.message : (err as Error).message);
    }
  }

  return (
    <Stack gap={6}>
      <Cluster justify="between" align="center">
        <Stack gap={1}>
          <Heading level={3}>Customer reviews</Heading>
          {summary.data && summary.data.count > 0 ? (
            <Cluster gap={2} align="center">
              <Rating value={summary.data.average} reviewCount={summary.data.count} />
              <Text size="sm" tone="muted">
                Based on {summary.data.count} review
                {summary.data.count === 1 ? '' : 's'}
              </Text>
            </Cluster>
          ) : (
            <Text tone="muted">Be the first to review this product.</Text>
          )}
        </Stack>
        {!open && auth.isAuthenticated && (
          <Button onClick={() => setOpen(true)}>Write a review</Button>
        )}
      </Cluster>

      {summary.data && summary.data.count > 0 && (
        <Stack gap={1}>
          {[5, 4, 3, 2, 1].map((bucket) => {
            const count = summary.data?.buckets?.[String(bucket)] ?? 0;
            const pct =
              summary.data && summary.data.count > 0
                ? Math.round((count / summary.data.count) * 100)
                : 0;
            return (
              <Cluster key={bucket} gap={3} align="center">
                <Text size="sm" tone="muted" className="w-8">
                  {bucket}★
                </Text>
                <div
                  className="bg-primary-subtle h-2 flex-1 overflow-hidden rounded-sm"
                  role="img"
                  aria-label={`${count} ${bucket}-star reviews`}
                >
                  <div className="bg-primary h-full" style={{ width: `${pct}%` }} />
                </div>
                <Text size="sm" tone="muted" className="w-10 text-right">
                  {count}
                </Text>
              </Cluster>
            );
          })}
        </Stack>
      )}

      {open && (
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <Stack gap={3}>
                {error && <Alert variant="error">{error}</Alert>}
                <FormField label="Your rating" htmlFor="r" required>
                  <select
                    id="r"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="border-default bg-canvas text-body-sm rounded-sm border px-3 py-2"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} stars
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Headline" htmlFor="t">
                  <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} />
                </FormField>
                <FormField label="Your review" htmlFor="b" required>
                  <Textarea
                    id="b"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    required
                  />
                </FormField>
                <Cluster gap={2}>
                  <Button type="submit" loading={submit.isPending}>
                    Submit review
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                </Cluster>
              </Stack>
            </form>
          </CardBody>
        </Card>
      )}

      {list.isLoading ? (
        <Text tone="muted">Loading reviews…</Text>
      ) : !list.data || list.data.data.length === 0 ? (
        <Text tone="muted">No reviews yet.</Text>
      ) : (
        <Stack gap={3}>
          {list.data.data.map((r) => (
            <Card key={r.id}>
              <CardBody>
                <Stack gap={2}>
                  <Cluster justify="between" align="start">
                    <Stack gap={1}>
                      <Rating value={r.rating} />
                      {r.title && <Text className="text-secondary font-semibold">{r.title}</Text>}
                      <Text size="sm" tone="muted">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </Text>
                    </Stack>
                    {r.verifiedPurchase && <Badge variant="muted">Verified purchase</Badge>}
                  </Cluster>
                  <Text>{r.body}</Text>
                  <Cluster justify="between" align="center">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await vote.mutateAsync(r.id);
                          toast.success('Thanks for the feedback');
                        } catch (err) {
                          if (ApiError.is(err) && err.code === 'ALREADY_VOTED') {
                            toast.error('You already voted on this review');
                          } else {
                            toast.error((err as Error).message);
                          }
                        }
                      }}
                      className="font-body text-body-sm text-muted hover:text-primary inline-flex items-center gap-2"
                      aria-label="Mark review helpful"
                    >
                      <ThumbsUp width={14} height={14} aria-hidden />
                      Helpful ({r.helpfulCount})
                    </button>
                  </Cluster>
                </Stack>
              </CardBody>
            </Card>
          ))}
          {list.data.total > PAGE_SIZE && (
            <Cluster gap={2} justify="center">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Text size="sm" tone="muted">
                Page {page} of {Math.ceil(list.data.total / PAGE_SIZE)}
              </Text>
              <Button
                variant="outline"
                disabled={page * PAGE_SIZE >= list.data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </Cluster>
          )}
        </Stack>
      )}
    </Stack>
  );
}
