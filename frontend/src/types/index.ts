export interface ImageData {
  id: string;
  file: File;
  url: string;
  dimensions: {
    width: number;
    height: number;
  };
  uploadedAt: Date;
}

export interface Region {
  id: string;
  x: number;          // X coordinate (pixels)
  y: number;          // Y coordinate (pixels)
  width: number;      // Width (pixels)
  height: number;     // Height (pixels)
  color: string;      // Visual identifier color
  label?: string;     // Optional user label
}

export interface OCRSession {
  id: string;
  imageId: string;
  regions: Region[];
  results: OCRResult[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface OCRResult {
  regionId: string;
  text: string;
  confidence?: number;
  processingTime: number;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

export interface UploadRequest {
  image: File;
}

export interface UploadResponse {
  imageId: string;
  imageUrl: string;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface ProcessOCRRequest {
  imageId: string;
  regions: Region[];
}

export interface ProcessOCRResponse {
  sessionId: string;
  results: OCRResult[];
  processingTime: number;
  success: boolean;
}