export interface ImageData {
  id: string;
  file: Express.Multer.File;
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

export interface OCRRequest {
  imageData: Buffer;
  regions: Region[];
  retryCount?: number;
}

export interface OCRResponse {
  results: OCRResult[];
  processingTime: number;
  success: boolean;
}

export interface GeminiConfig {
  apiKey: string;
  model: 'gemini-2.5-flash' | 'gemini-1.5-flash' | 'gemini-1.5-pro';
  timeout: number;
}

export interface VisionRequest {
  image: Buffer;
  prompt: string;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
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