import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { upload, handleUploadError } from '../middleware/upload';
import { normalizePath } from '../utils/pathUtils';
import { UploadResponse } from '../types';

export const uploadImage = [
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: {
            message: 'No image file provided',
            code: 'NO_FILE',
          },
        });
        return;
      }

      // Get image metadata using Sharp
      const metadata = await sharp(req.file.path).metadata();
      
      if (!metadata.width || !metadata.height) {
        // Clean up the uploaded file
        await fs.unlink(req.file.path).catch(() => {});
        
        res.status(400).json({
          success: false,
          error: {
            message: 'Unable to read image dimensions',
            code: 'INVALID_IMAGE',
          },
        });
        return;
      }

      // Extract UUID from filename (filename format: "uuid_originalname")
      const filename = path.basename(req.file.path);
      const imageId = filename.split('_')[0]; // Get the UUID part
      const imageUrl = `/uploads/${filename}`;

      const response: UploadResponse = {
        imageId,
        imageUrl: normalizePath(imageUrl),
        dimensions: {
          width: metadata.width,
          height: metadata.height,
        },
      };

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      // Clean up the uploaded file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      
      next(error);
    }
  },
];

// Middleware to handle upload errors
export const uploadErrorHandler = (
  err: Error & { code?: string },
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err.message?.includes('File size') || err.code === 'LIMIT_FILE_SIZE') {
    const errorInfo = handleUploadError(err);
    res.status(400).json({
      success: false,
      error: errorInfo,
    });
    return;
  }

  if (err.message?.includes('Invalid file type')) {
    const errorInfo = handleUploadError(err);
    res.status(400).json({
      success: false,
      error: errorInfo,
    });
    return;
  }

  // Pass other errors to the general error handler
  next(err);
};