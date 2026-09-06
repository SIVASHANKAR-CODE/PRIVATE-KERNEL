import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storageService } from '../services/storage.js';
import { config } from '../config/index.js';

// Setup multer memory storage so we can validate and securely write through storageService
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.storage.maxFileSize // 25 MB
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'audio/webm',
      'audio/ogg',
      'audio/mp3',
      'audio/mpeg',
      'audio/wav'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

export const uploadMiddleware = upload.single('file');

export const handleUpload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'FILE_REQUIRED', message: 'No file was uploaded' }
      });
    }

    const uploaded = await storageService.upload(req.file);

    return res.status(201).json({
      success: true,
      data: {
        file: uploaded
      }
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: error.message || 'File upload failed' }
    });
  }
};

export const serveFile = (req: Request, res: Response) => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = storageService.getFilePath(safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'Requested file not found' }
    });
  }

  // Set safe headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.sendFile(filePath);
};
