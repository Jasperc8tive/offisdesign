import { z } from 'zod';
import { apiFetch } from '../client';
import {
  announcementSchema,
  blogPostSchema,
  cmsPageSchema,
  faqSchema,
  navigationSchema,
  pageSchema,
  testimonialSchema,
} from '../schemas';

export const cmsService = {
  async page(slug: string, signal?: AbortSignal) {
    return apiFetch(cmsPageSchema, {
      path: `/v1/storefront/cms/pages/${encodeURIComponent(slug)}`,
      signal,
    });
  },

  async navigation(key: string, signal?: AbortSignal) {
    return apiFetch(navigationSchema, {
      path: `/v1/storefront/cms/navigation/${encodeURIComponent(key)}`,
      signal,
    });
  },

  async announcements(signal?: AbortSignal) {
    return apiFetch(z.array(announcementSchema), {
      path: '/v1/storefront/cms/announcements',
      signal,
    });
  },

  async testimonials(signal?: AbortSignal) {
    return apiFetch(z.array(testimonialSchema), {
      path: '/v1/storefront/cms/testimonials',
      signal,
    });
  },

  async faqs(signal?: AbortSignal) {
    return apiFetch(z.array(faqSchema), {
      path: '/v1/storefront/cms/faqs',
      signal,
    });
  },

  async posts(params: { page?: number; pageSize?: number } = {}, signal?: AbortSignal) {
    return apiFetch(pageSchema(blogPostSchema), {
      path: '/v1/storefront/cms/posts',
      query: params,
      signal,
    });
  },

  async post(slug: string, signal?: AbortSignal) {
    return apiFetch(blogPostSchema, {
      path: `/v1/storefront/cms/posts/${encodeURIComponent(slug)}`,
      signal,
    });
  },
};
