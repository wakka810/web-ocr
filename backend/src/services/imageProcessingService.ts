import sharp from 'sharp';
import { Region } from '../types';

export interface ProcessedRegion {
  regionId: string;
  imageBuffer: Buffer;
  mimeType: string;
}

export class ImageProcessingService {
  /**
   * Crop multiple regions from an image
   * @param imagePath - Path to the source image
   * @param regions - Array of regions to crop
   * @returns Array of processed regions with image buffers
   */
  static async cropRegions(
    imagePath: string,
    regions: Region[]
  ): Promise<ProcessedRegion[]> {
    const processedRegions: ProcessedRegion[] = [];

    for (const region of regions) {
      try {
        const croppedBuffer = await sharp(imagePath)
          .extract({
            left: Math.round(region.x),
            top: Math.round(region.y),
            width: Math.round(region.width),
            height: Math.round(region.height),
          })
          .toBuffer();

        processedRegions.push({
          regionId: region.id,
          imageBuffer: croppedBuffer,
          mimeType: 'image/png',
        });
      } catch (error) {
        console.error(`Failed to crop region ${region.id}:`, error);
        throw new Error(`Failed to process region ${region.id}`);
      }
    }

    return processedRegions;
  }

  /**
   * Validate image dimensions against regions
   * @param imagePath - Path to the source image
   * @param regions - Array of regions to validate
   * @returns True if all regions are within image bounds
   */
  static async validateRegions(
    imagePath: string,
    regions: Region[]
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const metadata = await sharp(imagePath).metadata();
      
      if (!metadata.width || !metadata.height) {
        return {
          valid: false,
          errors: ['Unable to read image dimensions'],
        };
      }

      for (const region of regions) {
        // Check if region is within image bounds
        if (region.x < 0 || region.y < 0) {
          errors.push(`Region ${region.id} has negative coordinates`);
        }

        if (region.x + region.width > metadata.width) {
          errors.push(`Region ${region.id} extends beyond image width`);
        }

        if (region.y + region.height > metadata.height) {
          errors.push(`Region ${region.id} extends beyond image height`);
        }

        // Check minimum size
        if (region.width < 10 || region.height < 10) {
          errors.push(`Region ${region.id} is too small (minimum 10x10 pixels)`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: ['Failed to validate image'],
      };
    }
  }

  /**
   * Optimize image for OCR processing
   * @param imageBuffer - Image buffer to optimize
   * @returns Optimized image buffer
   */
  static async optimizeForOCR(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Convert to grayscale and enhance contrast for better OCR
      return await sharp(imageBuffer)
        .grayscale()
        .normalize() // Enhance contrast
        .sharpen() // Sharpen text
        .toBuffer();
    } catch (error) {
      console.error('Failed to optimize image for OCR:', error);
      // Return original buffer if optimization fails
      return imageBuffer;
    }
  }

  /**
   * Get image metadata
   * @param imagePath - Path to the image
   * @returns Image metadata
   */
  static async getImageMetadata(imagePath: string) {
    try {
      const metadata = await sharp(imagePath).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format,
        size: metadata.size || 0,
      };
    } catch (error) {
      throw new Error('Failed to read image metadata');
    }
  }
}