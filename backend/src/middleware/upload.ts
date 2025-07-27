import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getUploadDir, getSafeFilename, ensureDir } from '../utils/pathUtils';

const SUPPORTED_FORMATS = ['png', 'jpg', 'jpeg', 'webp'];
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default

// File filter to validate uploaded files
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  const mimeType = file.mimetype.toLowerCase();

  const isValidFormat = SUPPORTED_FORMATS.some(format => {
    return ext === format || 
           mimeType === `image/${format}` ||
           (format === 'jpg' && (ext === 'jpeg' || mimeType === 'image/jpeg'));
  });

  if (isValidFormat) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`));
  }
};

// Configure storage
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      const uploadDir = getUploadDir();
      await ensureDir(uploadDir);
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (_req, file, cb) => {
    const uniqueId = uuidv4();
    const safeFilename = getSafeFilename(file.originalname);
    const finalFilename = `${uniqueId}_${safeFilename}`;
    cb(null, finalFilename);
  },
});

// Create multer upload middleware
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Error handler for multer errors
export const handleUploadError = (error: Error & { code?: string }): { message: string; code: string } => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return {
          message: `File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          code: 'FILE_TOO_LARGE',
        };
      case 'LIMIT_FILE_COUNT':
        return {
          message: 'Too many files uploaded',
          code: 'TOO_MANY_FILES',
        };
      case 'LIMIT_UNEXPECTED_FILE':
        return {
          message: 'Unexpected field name',
          code: 'UNEXPECTED_FIELD',
        };
      default:
        return {
          message: 'File upload error',
          code: 'UPLOAD_ERROR',
        };
    }
  }

  if (error.message) {
    return {
      message: error.message,
      code: 'VALIDATION_ERROR',
    };
  }

  return {
    message: 'Unknown upload error',
    code: 'UNKNOWN_ERROR',
  };
};