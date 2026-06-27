import { z } from 'zod';

export const folderInputSchema = z.object({
  name: z.string().min(1).max(120),
  parentId: z.string().uuid().nullish(),
});
export type FolderInput = z.infer<typeof folderInputSchema>;

export const presignUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(120),
  byteSize: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024),
  folderId: z.string().uuid().nullish(),
});
export type PresignUploadInput = z.infer<typeof presignUploadSchema>;

export const finalizeUploadSchema = z.object({
  storageKey: z.string().min(1).max(500),
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(120),
  byteSize: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  alt: z.string().max(500).optional(),
  folderId: z.string().uuid().nullish(),
});
export type FinalizeUploadInput = z.infer<typeof finalizeUploadSchema>;

export const updateMediaSchema = z.object({
  alt: z.string().max(500).nullish(),
  filename: z.string().max(255).optional(),
  folderId: z.string().uuid().nullish(),
  focalX: z.number().min(0).max(1).nullish(),
  focalY: z.number().min(0).max(1).nullish(),
});
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
