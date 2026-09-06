import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/index.js';

export interface UploadedFileResult {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface IStorageService {
  upload(file: Express.Multer.File): Promise<UploadedFileResult>;
  delete(filename: string): Promise<boolean>;
  getFilePath(filename: string): string;
}

class LocalStorageService implements IStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = config.storage.localPath;
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Express.Multer.File): Promise<UploadedFileResult> {
    // Generate safe cryptographically random filename with preserved safe extension
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const randomName = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`;
    const targetPath = path.join(this.uploadDir, randomName);

    if (file.path) {
      await fs.promises.rename(file.path, targetPath);
    } else if (file.buffer) {
      await fs.promises.writeFile(targetPath, file.buffer);
    } else {
      throw new Error('No file content provided');
    }

    const url = `/api/uploads/${randomName}`;
    return {
      filename: randomName,
      originalName: path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_'),
      mimeType: file.mimetype,
      size: file.size,
      url
    };
  }

  async delete(filename: string): Promise<boolean> {
    const safeFilename = path.basename(filename);
    const targetPath = path.join(this.uploadDir, safeFilename);
    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
      return true;
    }
    return false;
  }

  getFilePath(filename: string): string {
    const safeFilename = path.basename(filename);
    return path.join(this.uploadDir, safeFilename);
  }
}

// Storage abstraction factory
export const storageService: IStorageService = new LocalStorageService();
