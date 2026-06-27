'use client';

import { useQuery } from '@tanstack/react-query';
import { cmsService } from '../api/services/cms';

export const cmsKeys = {
  page: (slug: string) => ['cms', 'page', slug] as const,
  navigation: (key: string) => ['cms', 'navigation', key] as const,
  announcements: () => ['cms', 'announcements'] as const,
  testimonials: () => ['cms', 'testimonials'] as const,
  faqs: () => ['cms', 'faqs'] as const,
  posts: (params: { page?: number; pageSize?: number }) => ['cms', 'posts', params] as const,
  post: (slug: string) => ['cms', 'post', slug] as const,
};

const LONG_STALE = 5 * 60_000;

export function useCmsPage(slug: string | undefined) {
  return useQuery({
    queryKey: cmsKeys.page(slug ?? ''),
    queryFn: ({ signal }) => cmsService.page(slug!, signal),
    enabled: !!slug,
    staleTime: LONG_STALE,
  });
}

export function useNavigation(key: string) {
  return useQuery({
    queryKey: cmsKeys.navigation(key),
    queryFn: ({ signal }) => cmsService.navigation(key, signal),
    staleTime: LONG_STALE,
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: cmsKeys.announcements(),
    queryFn: ({ signal }) => cmsService.announcements(signal),
    staleTime: 60_000,
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: cmsKeys.testimonials(),
    queryFn: ({ signal }) => cmsService.testimonials(signal),
    staleTime: LONG_STALE,
  });
}

export function useFaqs() {
  return useQuery({
    queryKey: cmsKeys.faqs(),
    queryFn: ({ signal }) => cmsService.faqs(signal),
    staleTime: LONG_STALE,
  });
}

export function useBlogPosts(params: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: cmsKeys.posts(params),
    queryFn: ({ signal }) => cmsService.posts(params, signal),
    staleTime: 60_000,
  });
}

export function useBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: cmsKeys.post(slug ?? ''),
    queryFn: ({ signal }) => cmsService.post(slug!, signal),
    enabled: !!slug,
    staleTime: LONG_STALE,
  });
}
