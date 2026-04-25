import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private readonly bucket = 'yashil-quest-photos';
  private readonly storageDriver: string;
  private readonly uploadsDir: string;
  private client?: Minio.Client;

  constructor(private readonly config: ConfigService) {
    this.storageDriver = config.get('STORAGE_DRIVER', 'local');
    this.uploadsDir = path.resolve(
      process.cwd(),
      config.get('UPLOADS_DIR', path.join('..', 'uploads')),
    );

    if (this.storageDriver === 'minio') {
      this.client = new Minio.Client({
        endPoint: config.get('MINIO_ENDPOINT', 'localhost'),
        port: config.get<number>('MINIO_PORT', 9000),
        useSSL: config.get('MINIO_USE_SSL', 'false') === 'true',
        accessKey: config.get('MINIO_ACCESS_KEY', 'minioadmin'),
        secretKey: config.get('MINIO_SECRET_KEY', 'minioadmin'),
      });
    }
  }

  async onModuleInit() {
    if (this.storageDriver === 'minio') {
      await this.ensureBucketExists();
      return;
    }

    fs.mkdirSync(this.uploadsDir, { recursive: true });
    this.logger.log(`Local uploads directory ready: ${this.uploadsDir}`);
  }

  private async ensureBucketExists() {
    if (!this.client) {
      return;
    }

    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, 'us-east-1');
        const policy = JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        });
        await this.client.setBucketPolicy(this.bucket, policy);
        this.logger.log(`Bucket '${this.bucket}' created`);
      }
    } catch (error) {
      this.logger.error(`MinIO setup failed: ${error.message}`);
    }
  }

  private getLocalBaseUrl(): string {
    return this.config.get('UPLOADS_BASE_URL')
      || this.config.get('BACKEND_PUBLIC_URL')
      || `http://localhost:${this.config.get('PORT', '3001')}`;
  }

  async uploadBuffer(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    const objectName = `${Date.now()}-${filename}`;

    if (this.storageDriver === 'minio' && this.client) {
      await this.client.putObject(this.bucket, objectName, buffer, buffer.length, {
        'Content-Type': contentType,
      });

      const endpoint = this.config.get('MINIO_ENDPOINT', 'localhost');
      const port = this.config.get('MINIO_PORT', '9000');
      return `http://${endpoint}:${port}/${this.bucket}/${objectName}`;
    }

    fs.mkdirSync(this.uploadsDir, { recursive: true });
    const filePath = path.join(this.uploadsDir, objectName);
    await fs.promises.writeFile(filePath, buffer);
    return `${this.getLocalBaseUrl()}/uploads/${objectName}`;
  }

  async uploadBase64(base64: string, filename: string): Promise<string> {
    const buffer = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
    const contentType = base64.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
    return this.uploadBuffer(buffer, filename, contentType);
  }

  async deleteObject(objectName: string): Promise<void> {
    if (this.storageDriver === 'minio' && this.client) {
      await this.client.removeObject(this.bucket, objectName);
      return;
    }

    const filePath = path.join(this.uploadsDir, objectName);
    await fs.promises.unlink(filePath).catch(() => undefined);
  }

  async getPresignedUrl(objectName: string, expirySeconds = 3600): Promise<string> {
    if (this.storageDriver === 'minio' && this.client) {
      return this.client.presignedGetObject(this.bucket, objectName, expirySeconds);
    }

    return `${this.getLocalBaseUrl()}/uploads/${objectName}`;
  }

  getObjectNameFromUrl(url: string): string {
    if (this.storageDriver === 'minio') {
      return url.split(`/${this.bucket}/`)[1] || '';
    }

    return url.split('/uploads/')[1] || '';
  }
}
