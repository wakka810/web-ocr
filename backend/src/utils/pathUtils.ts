import path from 'path';
import { promises as fs } from 'fs';

/**
 * Ensures a directory exists, creating it if necessary
 * Works cross-platform (Windows/Linux)
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Gets the upload directory path
 * Uses environment variable or defaults to ./uploads
 */
export function getUploadDir(): string {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  return path.resolve(process.cwd(), uploadDir);
}

/**
 * Generates a safe filename from the original filename
 * Preserves extension but ensures cross-platform compatibility
 */
export function getSafeFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, ext);
  
  // Remove any characters that might cause issues on different platforms
  const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
  const timestamp = Date.now();
  
  return `${safeName}_${timestamp}${ext}`;
}

/**
 * Normalizes file paths for cross-platform compatibility
 */
export function normalizePath(filePath: string): string {
  return path.normalize(filePath).replace(/\\/g, '/');
}