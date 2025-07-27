import { useState, useCallback } from 'react';
import { api, ApiError } from '@/services/api';
import { ImageData, UploadResponse } from '@/types';

interface UseImageUploadReturn {
  uploadImage: (file: File) => Promise<ImageData | null>;
  isUploading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const uploadImage = useCallback(async (file: File): Promise<ImageData | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const response: UploadResponse = await api.uploadImage(file);

      const imageData: ImageData = {
        id: response.imageId,
        file,
        url: response.imageUrl,
        dimensions: response.dimensions,
        uploadedAt: new Date(),
      };

      return imageData;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during upload');
      }
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    uploadImage,
    isUploading,
    error,
    clearError,
  };
};