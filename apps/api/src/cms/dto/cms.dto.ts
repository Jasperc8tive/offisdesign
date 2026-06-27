import { z } from 'zod';

const cmsStatus = z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']);

export const pageInputSchema = z.object({
  slug: z.string().min(1).max(80).optional(),
  title: z.string().min(1).max(200),
  kind: z.enum(['STANDARD', 'LANDING']).default('STANDARD'),
  seo: z.record(z.unknown()).optional(),
  status: cmsStatus.default('DRAFT'),
  scheduledAt: z.coerce.date().optional(),
  unscheduledAt: z.coerce.date().optional(),
});
export type PageInput = z.infer<typeof pageInputSchema>;
export const pagePatchSchema = pageInputSchema.partial().extend({
  version: z.number().int().min(0),
});
export type PagePatch = z.infer<typeof pagePatchSchema>;

export const blockInputSchema = z.object({
  kind: z.string().min(1).max(64), // 'hero' | 'banner' | 'rich_text' | …
  position: z.number().int().min(0).default(0),
  payload: z.record(z.unknown()),
});
export type BlockInput = z.infer<typeof blockInputSchema>;

export const navigationInputSchema = z.object({
  key: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  items: z.array(z.unknown()),
});
export type NavigationInput = z.infer<typeof navigationInputSchema>;

export const announcementInputSchema = z.object({
  message: z.string().min(1).max(280),
  href: z.string().url().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});
export type AnnouncementInput = z.infer<typeof announcementInputSchema>;

export const testimonialInputSchema = z.object({
  author: z.string().min(1).max(200),
  quote: z.string().min(1).max(2000),
  source: z.string().max(200).optional(),
  imageId: z.string().uuid().optional(),
  isVisible: z.boolean().default(true),
});
export type TestimonialInput = z.infer<typeof testimonialInputSchema>;

export const faqInputSchema = z.object({
  category: z.string().max(120).optional(),
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(5000),
  position: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
});
export type FaqInput = z.infer<typeof faqInputSchema>;

export const authorInputSchema = z.object({
  slug: z.string().min(1).max(80).optional(),
  name: z.string().min(1).max(200),
  bio: z.string().max(5000).optional(),
  avatarMediaId: z.string().uuid().nullish(),
});
export type AuthorInput = z.infer<typeof authorInputSchema>;

export const blogPostInputSchema = z.object({
  slug: z.string().min(1).max(80).optional(),
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional(),
  body: z.string().min(1),
  coverMediaId: z.string().uuid().nullish(),
  authorId: z.string().uuid().nullish(),
  status: cmsStatus.default('DRAFT'),
  seo: z.record(z.unknown()).optional(),
  scheduledAt: z.coerce.date().optional(),
  unscheduledAt: z.coerce.date().optional(),
  tags: z.array(z.string().min(1)).default([]),
});
export type BlogPostInput = z.infer<typeof blogPostInputSchema>;
export const blogPostPatchSchema = blogPostInputSchema.partial().extend({
  version: z.number().int().min(0),
});
export type BlogPostPatch = z.infer<typeof blogPostPatchSchema>;
