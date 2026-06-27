import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type {
  PutObjectInput,
  PutObjectResult,
  SignedUrlOptions,
  StorageDriver,
} from './interface.js';

export interface LocalDriverConfig {
  baseDir: string;
  publicBaseUrl: string;
}

/**
 * Local-filesystem storage. Suitable for development and tests. Signed URLs
 * fall back to public URLs — the local driver does not enforce expiry.
 */
export class LocalStorageDriver implements StorageDriver {
  readonly name = 'local';

  constructor(private readonly cfg: LocalDriverConfig) {}

  private resolve(key: string): string {
    const safe = key.replace(/^\/+/, '').replace(/\.\./g, '');
    return path.join(this.cfg.baseDir, safe);
  }

  async put(input: PutObjectInput): Promise<PutObjectResult> {
    const full = this.resolve(input.key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, input.body);
    return { key: input.key, size: input.body.byteLength, contentType: input.contentType };
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await fs.rm(this.resolve(key), { force: true });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }

  publicUrl(key: string): string {
    return `${this.cfg.publicBaseUrl.replace(/\/$/, '')}/${key.replace(/^\/+/, '')}`;
  }

  async signedGetUrl(key: string, _opts: SignedUrlOptions): Promise<string> {
    return this.publicUrl(key);
  }

  async signedPutUrl(key: string, _ct: string, _opts: SignedUrlOptions): Promise<string> {
    return this.publicUrl(key);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await fs.mkdir(this.cfg.baseDir, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }
}
