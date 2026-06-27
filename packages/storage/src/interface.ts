export interface PutObjectInput {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  cacheControl?: string;
}

export interface PutObjectResult {
  key: string;
  size: number;
  contentType: string;
}

export interface SignedUrlOptions {
  /** Seconds until URL expires. */
  expiresInSec: number;
}

export interface StorageDriver {
  readonly name: string;
  put(input: PutObjectInput): Promise<PutObjectResult>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  /** Long-lived public URL (for already-public objects). */
  publicUrl(key: string): string;
  /** Time-limited signed URL for private GET (S3 only — local falls back to publicUrl). */
  signedGetUrl(key: string, opts: SignedUrlOptions): Promise<string>;
  /** Time-limited signed URL for direct browser upload (S3 only). */
  signedPutUrl(key: string, contentType: string, opts: SignedUrlOptions): Promise<string>;
  /** Readiness probe. */
  healthCheck(): Promise<boolean>;
}
