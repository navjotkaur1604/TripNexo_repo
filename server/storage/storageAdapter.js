const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');
const { logger } = require('../config/logger');

/**
 * Storage abstraction supporting local filesystem storage for development
 * and an S3-compatible cloud storage adapter when credentials are configured.
 */
class LocalStorageAdapter {
  constructor(baseDir = env.uploadDir) {
    this.baseDir = path.resolve(baseDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveFile(fileBuffer, originalName) {
    const ext = path.extname(originalName).toLowerCase() || '.png';
    const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const targetPath = path.join(this.baseDir, safeName);
    await fs.promises.writeFile(targetPath, fileBuffer);
    logger.info('Saved profile file to local storage', { filename: safeName });
    return {
      key: safeName,
      url: `/uploads/${safeName}`,
      driver: 'local',
    };
  }

  async deleteFile(fileUrl) {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) return false;
    const safeFilename = path.basename(fileUrl);
    const targetPath = path.join(this.baseDir, safeFilename);
    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
      return true;
    }
    return false;
  }
}

class CloudStorageAdapter {
  constructor(config = env.cloudStorage) {
    this.config = config;
  }

  isConfigured() {
    return Boolean(
      this.config.bucket &&
        this.config.accessKey &&
        this.config.secretKey &&
        this.config.endpoint
    );
  }

  async saveFile(fileBuffer, originalName, mimeType) {
    if (!this.isConfigured()) {
      throw new Error(
        'Cloud storage driver selected, but CLOUD_STORAGE_BUCKET/ENDPOINT/ACCESS_KEY/SECRET_KEY are missing.'
      );
    }

    const ext = path.extname(originalName).toLowerCase() || '.png';
    const objectKey = `profiles/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const baseEndpoint = this.config.endpoint.replace(/\/$/, '');
    const targetUrl = `${baseEndpoint}/${this.config.bucket}/${objectKey}`;

    // Uses standard HTTP PUT against pre-configured S3-compatible/presigned endpoint
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType || 'application/octet-stream',
        'x-amz-acl': 'public-read',
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      throw new Error(`Cloud storage upload failed with status ${response.status}`);
    }

    logger.info('Uploaded profile file to cloud storage', {
      bucket: this.config.bucket,
      objectKey,
    });

    return {
      key: objectKey,
      url: targetUrl,
      driver: 's3',
    };
  }

  async deleteFile() {
    return false;
  }
}

function getStorageAdapter() {
  if (env.storageDriver === 's3') {
    const cloud = new CloudStorageAdapter();
    if (cloud.isConfigured()) {
      return cloud;
    }
    logger.warn('STORAGE_DRIVER=s3 requested without full credentials; falling back to local storage');
  }
  return new LocalStorageAdapter();
}

module.exports = {
  LocalStorageAdapter,
  CloudStorageAdapter,
  getStorageAdapter,
};
