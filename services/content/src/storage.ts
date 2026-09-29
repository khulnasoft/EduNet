import { createHmac, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Storage abstraction for EduNet media.
 *
 * Private files are never exposed through permanent public URLs. Callers must
 * mint a short-lived signed URL via `getSignedUrl` and the consumer must
 * validate it with `verifySignedUrl`.
 *
 * Only a filesystem-backed provider is implemented. A previous S3 provider
 * returned fabricated `s3://` URLs, an empty download body, a no-op delete and
 * an `exists` that was hardcoded to `true`. That was fake production behaviour
 * and has been removed rather than shipped.
 */
export interface StorageProvider {
  /** Stores `data` under `key`; returns the key. */
  put(key: string, data: Buffer, mimeType: string): Promise<string>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  /** Human-readable location, for operator logs. Not a public URL. */
  describe(key: string): string;
}

export class StorageError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'INVALID_KEY'
      | 'NOT_FOUND'
      | 'TOO_LARGE'
      | 'UNSUPPORTED_TYPE'
      | 'UNAVAILABLE',
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'video/mp4',
  'video/webm',
]);

/** Extensions permitted per media category, used to derive a safe key. */
const EXTENSION_BY_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'text/markdown': '.md',
  'text/csv': '.csv',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

/**
 * Builds a storage key that cannot escape the storage root.
 *
 * A key is `<scope>/<uuid>.<ext>`. The scope is restricted to a safe
 * character set and the filename is a generated UUID, so user-supplied names
 * never reach the filesystem. This removes the path traversal that a naive
 * `path.join(basePath, userKey)` allows via `../`.
 */
export function buildStorageKey(scope: string, mimeType: string, id: string): string {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(scope)) {
    throw new StorageError(`Invalid storage scope: ${scope}`, 'INVALID_KEY');
  }

  const ext = EXTENSION_BY_MIME[mimeType];
  if (!ext) {
    throw new StorageError(`Unsupported media type: ${mimeType}`, 'UNSUPPORTED_TYPE');
  }

  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    throw new StorageError('Invalid media id', 'INVALID_KEY');
  }

  return `${scope}/${id}${ext}`;
}

/** Rejects any key that is not a previously-generated, well-formed key. */
export function assertSafeKey(key: string): void {
  if (!/^[a-zA-Z0-9_-]+\/[0-9a-fA-F-]{36}\.[a-z0-9]{1,5}$/.test(key)) {
    throw new StorageError(`Unsafe storage key: ${key}`, 'INVALID_KEY');
  }
}

export class FilesystemStorageProvider implements StorageProvider {
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  /** Resolves a key to an absolute path, refusing anything outside the root. */
  private resolve(key: string): string {
    assertSafeKey(key);
    const full = path.resolve(this.root, key);

    // Defence in depth: even with a validated key, confirm containment.
    if (full !== this.root && !full.startsWith(this.root + path.sep)) {
      throw new StorageError(`Unsafe storage key: ${key}`, 'INVALID_KEY');
    }

    return full;
  }

  async put(key: string, data: Buffer, _mimeType: string): Promise<string> {
    if (!Buffer.isBuffer(data)) {
      throw new StorageError('Upload payload must be a Buffer', 'UNSUPPORTED_TYPE');
    }
    if (data.length === 0) {
      throw new StorageError('Refusing to store an empty file', 'UNSUPPORTED_TYPE');
    }
    if (data.length > MAX_UPLOAD_BYTES) {
      throw new StorageError(
        `Upload exceeds ${MAX_UPLOAD_BYTES} byte limit`,
        'TOO_LARGE',
      );
    }

    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    return key;
  }

  async get(key: string): Promise<Buffer> {
    const full = this.resolve(key);
    try {
      return await fs.readFile(full);
    } catch {
      throw new StorageError(`Object not found: ${key}`, 'NOT_FOUND');
    }
  }

  async delete(key: string): Promise<void> {
    const full = this.resolve(key);
    try {
      await fs.unlink(full);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        throw new StorageError(`Object not found: ${key}`, 'NOT_FOUND');
      }
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const full = this.resolve(key);
      await fs.access(full);
      return true;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      return false;
    }
  }

  describe(key: string): string {
    return `file://${this.resolve(key)}`;
  }
}

/* ------------------------------------------------------------------ */
/* Signed URLs for private media                                       */
/* ------------------------------------------------------------------ */

function signingSecret(): string {
  const secret = process.env.MEDIA_SIGNING_SECRET ?? process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new StorageError('MEDIA_SIGNING_SECRET is not configured', 'UNAVAILABLE');
  }
  return secret;
}

function signatureFor(key: string, expiresAt: number): string {
  return createHmac('sha256', signingSecret())
    .update(`${key}:${expiresAt}`)
    .digest('hex');
}

export interface SignedMediaUrl {
  /** Path to serve, including signature and expiry query parameters. */
  url: string;
  expiresAt: number;
}

/**
 * Mints a time-limited, signed URL for a private object.
 *
 * The signature binds the key and the expiry, so neither the path nor the
 * lifetime can be extended by the client.
 */
export function getSignedUrl(
  key: string,
  expirySeconds = 300,
): SignedMediaUrl {
  assertSafeKey(key);

  const maxExpiry = 3600;
  if (!Number.isFinite(expirySeconds) || expirySeconds <= 0) {
    throw new StorageError('Invalid expiry', 'INVALID_KEY');
  }
  const seconds = Math.min(Math.floor(expirySeconds), maxExpiry);

  const expiresAt = Math.floor(Date.now() / 1000) + seconds;
  const signature = signatureFor(key, expiresAt);
  const encodedKey = encodeURIComponent(key);

  return {
    url: `/api/content/files/${encodedKey}?expires=${expiresAt}&signature=${signature}`,
    expiresAt,
  };
}

/** Validates a signed URL. Returns the key only when the signature is valid and unexpired. */
export function verifySignedUrl(
  key: string,
  expires: number,
  signature: string,
): { valid: true } | { valid: false; reason: 'EXPIRED' | 'BAD_SIGNATURE' } {
  assertSafeKey(key);

  if (!Number.isFinite(expires) || expires <= 0) {
    return { valid: false, reason: 'BAD_SIGNATURE' };
  }

  if (Math.floor(Date.now() / 1000) > expires) {
    return { valid: false, reason: 'EXPIRED' };
  }

  const expected = signatureFor(key, expires);
  const provided = Buffer.from(String(signature));
  const computed = Buffer.from(expected);

  if (provided.length !== computed.length) {
    return { valid: false, reason: 'BAD_SIGNATURE' };
  }

  return timingSafeEqual(provided, computed)
    ? { valid: true }
    : { valid: false, reason: 'BAD_SIGNATURE' };
}

export function createStorageProvider(): StorageProvider {
  const root = process.env.MEDIA_STORAGE_PATH || './.data/media';
  return new FilesystemStorageProvider(root);
}

let provider: StorageProvider | null = null;

/** Lazily constructed so importing this module never touches the filesystem. */
export function getStorage(): StorageProvider {
  if (!provider) {
    provider = createStorageProvider();
  }
  return provider;
}
