'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewsService } from '../api/services/reviews';

export const reviewKeys = {
  list: (productId: string, params: { page?: number; pageSize?: number }) =>
    ['reviews', productId, 'list', params] as const,
  summary: (productId: string) => ['reviews', productId, 'summary'] as const,
};

export function useReviews(
  productId: string | undefined,
  params: { page?: number; pageSize?: number } = {},
) {
  return useQuery({
    queryKey: reviewKeys.list(productId ?? '', params),
    queryFn: ({ signal }) => reviewsService.list(productId!, params, signal),
    enabled: !!productId,
  });
}

export function useReviewSummary(productId: string | undefined) {
  return useQuery({
    queryKey: reviewKeys.summary(productId ?? ''),
    queryFn: ({ signal }) => reviewsService.summary(productId!, signal),
    enabled: !!productId,
    staleTime: 60_000,
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewsService.submit,
    onSuccess: (review) => {
      qc.invalidateQueries({ queryKey: ['reviews', review.productId] });
    },
  });
}

export function useVoteHelpful() {
  return useMutation({ mutationFn: reviewsService.vote });
}
