export interface StorageProvider {
  upload(key: string, data: Buffer, mimeType: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expirySeconds?: number): Promise<string>;
  getPublicUrl(key: string): string;
  exists(key: string): Promise<boolean>;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface FileMetadata {
  key: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  isPublic: boolean;
  signedUrl?: string;
}

class LocalStorageProvider implements StorageProvider {
  private basePath: string;

  constructor(basePath: string = './uploads') {
    this.basePath = basePath;
  }

  async upload(key: string, data: Buffer, mimeType: string): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const fullPath = path.join(this.basePath, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const fs = await import('fs/promises');
    const path = await import('path');
    return fs.readFile(path.join(this.basePath, key));
  }

  async delete(key: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    await fs.unlink(path.join(this.basePath, key));
  }

  async getSignedUrl(key: string, expirySeconds = 3600): Promise<string> {
    return `/api/content/files/${key}?expiry=${expirySeconds}`;
  }

  getPublicUrl(key: string): string {
    return `/api/content/files/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    const fs = await import('fs/promises');
    const path = await import('path');
    try {
      await fs.access(path.join(this.basePath, key));
      return true;
    } catch {
      return false;
    }
  }
}

class S3StorageProvider implements StorageProvider {
  private bucket: string;
  private region: string;

  constructor(bucket: string, region: string = 'us-east-1') {
    this.bucket = bucket;
    this.region = region;
  }

  async upload(key: string, data: Buffer, mimeType: string): Promise<string> {
    return `s3://${this.bucket}/${key}`;
  }

  async download(key: string): Promise<Buffer> {
    return Buffer.from('');
  }

  async delete(key: string): Promise<void> {
  }

  async getSignedUrl(key: string, expirySeconds = 3600): Promise<string> {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}?expiry=${expirySeconds}`;
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    return true;
  }
}

export function createStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'local';

  if (provider === 's3') {
    return new S3StorageProvider(
      process.env.S3_BUCKET || 'edunet-uploads',
      process.env.S3_REGION || 'us-east-1'
    );
  }

  return new LocalStorageProvider(process.env.UPLOAD_PATH || './uploads');
}

export const storage = createStorageProvider();
