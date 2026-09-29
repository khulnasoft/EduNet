import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import {
  FilesystemStorageProvider,
  StorageError,
  MAX_UPLOAD_BYTES,
  buildStorageKey,
  assertSafeKey,
  isAllowedMimeType,
  getSignedUrl,
  verifySignedUrl,
} from './storage';

const UUID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

describe('mime type allowlist', () => {
  it('permits documents and media', () => {
    expect(isAllowedMimeType('application/pdf')).toBe(true);
    expect(isAllowedMimeType('image/png')).toBe(true);
    expect(isAllowedMimeType('video/mp4')).toBe(true);
  });

  it('rejects executable and unknown types', () => {
    expect(isAllowedMimeType('application/x-msdownload')).toBe(false);
    expect(isAllowedMimeType('text/html')).toBe(false);
    expect(isAllowedMimeType('application/octet-stream')).toBe(false);
  });
});

describe('buildStorageKey', () => {
  it('builds a scoped, generated key', () => {
    expect(buildStorageKey('lessons', 'image/png', UUID)).toBe(`lessons/${UUID}.png`);
  });

  it('rejects a scope containing traversal characters', () => {
    expect(() => buildStorageKey('../etc', 'image/png', UUID)).toThrow(StorageError);
  });

  it('rejects an unsupported mime type', () => {
    expect(() => buildStorageKey('lessons', 'application/x-msdownload', UUID)).toThrow(
      /Unsupported media type/,
    );
  });

  it('rejects a non-uuid id', () => {
    expect(() => buildStorageKey('lessons', 'image/png', 'x'.repeat(36))).toThrow(
      /Invalid media id/,
    );
  });
});

describe('assertSafeKey', () => {
  it('accepts a generated key', () => {
    expect(() => assertSafeKey(`lessons/${UUID}.png`)).not.toThrow();
  });

  it('rejects traversal attempts', () => {
    for (const key of [
      '../../etc/passwd',
      `lessons/../../etc/passwd`,
      'lessons/' + '../'.repeat(5) + 'etc/passwd',
      'a/../../b.png',
    ]) {
      expect(() => assertSafeKey(key)).toThrow(StorageError);
    }
  });

  it('rejects absolute paths and bare filenames', () => {
    expect(() => assertSafeKey('/etc/passwd')).toThrow(StorageError);
    expect(() => assertSafeKey('passwd')).toThrow(StorageError);
  });
});

describe('FilesystemStorageProvider', () => {
  let root: string;
  let store: FilesystemStorageProvider;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'edunet-media-'));
    store = new FilesystemStorageProvider(root);
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('round-trips an object', async () => {
    const key = buildStorageKey('lessons', 'text/plain', UUID);
    const body = Buffer.from('hello world');

    await store.put(key, body, 'text/plain');

    expect((await store.get(key)).toString()).toBe('hello world');
    expect(await store.exists(key)).toBe(true);
  });

  it('refuses to escape the storage root via traversal', async () => {
    const victim = path.join(root, '..', `secret-${Date.now()}.txt`);
    await fs.writeFile(victim, 'top secret');

    await expect(store.get('../secret.txt')).rejects.toThrow(StorageError);
    await expect(store.put('../evil.txt', Buffer.from('x'), 'text/plain')).rejects.toThrow(
      StorageError,
    );

    // the file outside the root must be untouched
    expect(await fs.readFile(victim, 'utf8')).toBe('top secret');
    await fs.unlink(victim);
  });

  it('reports a missing object as NOT_FOUND', async () => {
    const key = buildStorageKey('lessons', 'image/png', UUID);
    await expect(store.get(key)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(await store.exists(key)).toBe(false);
  });

  it('refuses an empty upload', async () => {
    const key = buildStorageKey('lessons', 'text/plain', UUID);
    await expect(store.put(key, Buffer.alloc(0), 'text/plain')).rejects.toThrow(
      /empty file/,
    );
  });

  it('refuses an upload over the size limit', async () => {
    const key = buildStorageKey('lessons', 'video/mp4', UUID);
    const tooBig = Buffer.alloc(MAX_UPLOAD_BYTES + 1);
    await expect(store.put(key, tooBig, 'video/mp4')).rejects.toMatchObject({
      code: 'TOO_LARGE',
    });
  });

  it('deletes an object and then reports it missing', async () => {
    const key = buildStorageKey('lessons', 'text/plain', UUID);
    await store.put(key, Buffer.from('x'), 'text/plain');

    await store.delete(key);

    expect(await store.exists(key)).toBe(false);
    await expect(store.delete(key)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('signed URLs', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, MEDIA_SIGNING_SECRET: 'media-signing-secret' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('mints a signed url bound to the key and expiry', () => {
    const key = buildStorageKey('lessons', 'image/png', UUID);
    const { url, expiresAt } = getSignedUrl(key, 300);

    expect(url).toContain(encodeURIComponent(key));
    expect(url).toContain(`expires=${expiresAt}`);
    expect(url).toContain('signature=');
  });

  it('caps the expiry at one hour', () => {
    const key = buildStorageKey('lessons', 'image/png', UUID);
    const { expiresAt } = getSignedUrl(key, 999_999);
    const now = Math.floor(Date.now() / 1000);
    expect(expiresAt - now).toBeLessThanOrEqual(3600);
  });

  it('accepts a freshly minted signature', () => {
    const key = buildStorageKey('lessons', 'image/png', UUID);
    const { url, expiresAt } = getSignedUrl(key, 300);
    const signature = new URL(url, 'http://x').searchParams.get('signature')!;

    expect(verifySignedUrl(key, expiresAt, signature)).toEqual({ valid: true });
  });

  it('rejects an expired signature', () => {
    const key = buildStorageKey('lessons', 'image/png', UUID);
    const expired = Math.floor(Date.now() / 1000) - 10;
    const { url } = getSignedUrl(key, 300);
    const signature = new URL(url, 'http://x').searchParams.get('signature')!;

    expect(verifySignedUrl(key, expired, signature)).toEqual({
      valid: false,
      reason: 'EXPIRED',
    });
  });

  it('rejects a signature minted for a different key', () => {
    const keyA = buildStorageKey('lessons', 'image/png', UUID);
    const keyB = `lessons/${UUID.replace(/^./, 'b')}.png`;
    const { expiresAt } = getSignedUrl(keyA, 300);
    const { url: urlB } = getSignedUrl(keyB, 300);
    const signatureB = new URL(urlB, 'http://x').searchParams.get('signature')!;

    expect(verifySignedUrl(keyA, expiresAt, signatureB)).toEqual({
      valid: false,
      reason: 'BAD_SIGNATURE',
    });
  });

  it('rejects a tampered expiry', () => {
    const key = buildStorageKey('lessons', 'image/png', UUID);
    const { url, expiresAt } = getSignedUrl(key, 300);
    const signature = new URL(url, 'http://x').searchParams.get('signature')!;

    // client extends the lifetime; the signature no longer matches
    expect(verifySignedUrl(key, expiresAt + 86_400, signature)).toEqual({
      valid: false,
      reason: 'BAD_SIGNATURE',
    });
  });

  it('throws when no signing secret is configured', () => {
    delete process.env.MEDIA_SIGNING_SECRET;
    delete process.env.JWT_SECRET;
    const key = buildStorageKey('lessons', 'image/png', UUID);
    expect(() => getSignedUrl(key)).toThrow(/MEDIA_SIGNING_SECRET/);
  });
});
