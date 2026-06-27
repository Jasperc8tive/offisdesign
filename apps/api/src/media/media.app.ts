import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import { type Prisma } from '@offisdesign/database';
import { MediaRepository } from './media.repository';
import { StorageService } from '../storage/storage.service';
import { ActivityService } from '../audit/activity.service';
import type {
  FinalizeUploadInput,
  FolderInput,
  PresignUploadInput,
  UpdateMediaInput,
} from './dto/media.dto';

const PRESIGN_TTL_SEC = 300;

@Injectable()
export class MediaApplicationService {
  constructor(
    private readonly repo: MediaRepository,
    private readonly storage: StorageService,
    private readonly activity: ActivityService,
  ) {}

  // ── Folders ───────────────────────────────────────────────────────────

  listFolders() {
    return this.repo.listFolders();
  }

  async createFolder(input: FolderInput) {
    const parent = input.parentId ? await this.repo.findFolderById(input.parentId) : null;
    const path = parent ? `${parent.path}/${slug(input.name)}` : `/${slug(input.name)}`;
    const id = uuidv7();
    return this.repo.createFolder({
      id,
      name: input.name,
      path,
      ...(input.parentId ? { parent: { connect: { id: input.parentId } } } : {}),
    });
  }

  async deleteFolder(id: string) {
    const folder = await this.repo.findFolderById(id);
    if (!folder) throw new NotFoundException();
    if (folder.deletedAt) return folder;
    return this.repo.softDeleteFolder(id);
  }

  // ── Uploads ───────────────────────────────────────────────────────────

  /**
   * Phase 1 — server hands the client a signed URL + the storage key it
   * should upload to. The Media row is created on `finalize` once the upload
   * completes.
   */
  async presignUpload(input: PresignUploadInput, actorId?: string) {
    if (!input.contentType.startsWith('image/') && !input.contentType.startsWith('application/')) {
      throw new BadRequestException({ code: 'UNSUPPORTED_CONTENT_TYPE' });
    }
    const storageKey = `uploads/${new Date().toISOString().slice(0, 10)}/${uuidv7()}-${sanitize(
      input.filename,
    )}`;
    const url = await this.storage.driver.signedPutUrl(storageKey, input.contentType, {
      expiresInSec: PRESIGN_TTL_SEC,
    });
    if (actorId) {
      await this.activity.log({
        action: 'media.presign',
        actorId,
        metadata: { storageKey, contentType: input.contentType },
      });
    }
    return { storageKey, url, expiresInSec: PRESIGN_TTL_SEC };
  }

  /**
   * Phase 2 — caller has uploaded to `storageKey`. Confirm it exists in
   * storage and persist the Media row.
   */
  async finalizeUpload(input: FinalizeUploadInput, actorId?: string) {
    const exists = await this.storage.driver.exists(input.storageKey);
    if (!exists) {
      throw new BadRequestException({
        code: 'UPLOAD_MISSING',
        message: 'Object not found at storage key.',
      });
    }
    if (await this.repo.storageKeyExists(input.storageKey)) {
      throw new BadRequestException({ code: 'STORAGE_KEY_REUSED' });
    }
    const id = uuidv7();
    const media = await this.repo.create({
      id,
      storageKey: input.storageKey,
      filename: input.filename,
      contentType: input.contentType,
      byteSize: input.byteSize,
      ...(input.width !== undefined ? { width: input.width } : {}),
      ...(input.height !== undefined ? { height: input.height } : {}),
      ...(input.alt ? { alt: input.alt } : {}),
      ...(input.folderId ? { folder: { connect: { id: input.folderId } } } : {}),
      ...(actorId ? { uploadedBy: actorId } : {}),
    });
    if (actorId) {
      await this.activity.log({
        action: 'media.create',
        actorId,
        aggregateType: 'media',
        aggregateId: id,
      });
    }
    return media;
  }

  list(query: {
    folderId?: string | null | undefined;
    q?: string | undefined;
    page: number;
    pageSize: number;
    includeDeleted?: boolean | undefined;
  }) {
    return this.repo.list(
      {
        ...(query.folderId !== undefined ? { folderId: query.folderId } : {}),
        ...(query.q ? { q: query.q } : {}),
        ...(query.includeDeleted ? { includeDeleted: true } : {}),
      },
      { page: query.page, pageSize: query.pageSize },
    );
  }

  async update(id: string, input: UpdateMediaInput) {
    const existing = await this.repo.findById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    const data: Prisma.MediaUpdateInput = {
      ...(input.alt !== undefined ? { alt: input.alt ?? null } : {}),
      ...(input.filename ? { filename: input.filename } : {}),
      ...(input.folderId !== undefined
        ? input.folderId
          ? { folder: { connect: { id: input.folderId } } }
          : { folder: { disconnect: true } }
        : {}),
      ...(input.focalX !== undefined ? { focalX: input.focalX ?? null } : {}),
      ...(input.focalY !== undefined ? { focalY: input.focalY ?? null } : {}),
    };
    return this.repo.update(id, data);
  }

  async delete(id: string, actorId?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException();
    if (existing.deletedAt) return existing;
    const deleted = await this.repo.softDelete(id);
    if (actorId) {
      await this.activity.log({
        action: 'media.delete',
        actorId,
        aggregateType: 'media',
        aggregateId: id,
      });
    }
    return deleted;
  }

  /** Cron entry — purge storage for media soft-deleted ≥ 7 days ago. */
  async runCleanup() {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const stale = await this.repo.findDeletedBefore(cutoff);
    let count = 0;
    for (const item of stale) {
      await this.storage.driver.delete(item.storageKey).catch(() => undefined);
      // Best-effort: also drop derivatives.
      const derivs = (item.derivatives as Record<string, { key: string }> | null) ?? {};
      for (const d of Object.values(derivs)) {
        await this.storage.driver.delete(d.key).catch(() => undefined);
      }
      await this.repo.hardDelete(item.id);
      count++;
    }
    return count;
  }

  async writeDerivatives(id: string, derivatives: Record<string, unknown>) {
    return this.repo.update(id, { derivatives: derivatives as Prisma.InputJsonValue });
  }
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(0, 120);
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}
