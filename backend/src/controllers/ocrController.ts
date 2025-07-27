import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ImageProcessingService, ProcessedRegion } from '../services/imageProcessingService';
import { GeminiService } from '../services/geminiService';
import { getUploadDir } from '../utils/pathUtils';
import { retryWithBackoff, withTimeout } from '../utils/retryUtils';
import { 
  ProcessOCRRequest, 
  ProcessOCRResponse, 
  OCRSession, 
  GeminiConfig,
  VisionRequest,
  Region
} from '../types';

// In-memory session storage (replace with database in production)
const sessions = new Map<string, OCRSession>();

// Initialize Gemini service
const geminiConfig: GeminiConfig = {
  apiKey: process.env.GEMINI_API_KEY || '',
  model: 'gemini-2.5-flash',
  timeout: parseInt(process.env.API_TIMEOUT || '30000'),
};

const geminiService = new GeminiService(geminiConfig);

export const processOCR = async (
  req: Request<Record<string, never>, Record<string, never>, ProcessOCRRequest>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { imageId, regions } = req.body;

    // Validate request
    if (!imageId || !regions || regions.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Image ID and regions are required',
          code: 'INVALID_REQUEST',
        },
      });
      return;
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Gemini API key not configured',
          code: 'CONFIG_ERROR',
        },
      });
      return;
    }

    // Create session
    const sessionId = uuidv4();
    const session: OCRSession = {
      id: sessionId,
      imageId,
      regions,
      results: [],
      status: 'processing',
      createdAt: new Date(),
    };

    sessions.set(sessionId, session);

    // Start async processing
    processOCRAsync(sessionId, imageId, regions).catch(error => {
      console.error('Async OCR processing failed:', error);
      const session = sessions.get(sessionId);
      if (session) {
        session.status = 'failed';
        session.completedAt = new Date();
      }
    });

    // Return immediate response with session ID
    const response: ProcessOCRResponse = {
      sessionId,
      results: [],
      processingTime: 0,
      success: true,
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

export const getOCRStatus = async (
  req: Request<{ sessionId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        },
      });
      return;
    }

    const processingTime = session.completedAt
      ? session.completedAt.getTime() - session.createdAt.getTime()
      : Date.now() - session.createdAt.getTime();

    const response: ProcessOCRResponse = {
      sessionId: session.id,
      results: session.results,
      processingTime,
      success: session.status === 'completed',
    };

    res.json({
      success: true,
      data: {
        ...response,
        status: session.status,
        progress: {
          current: session.results.length,
          total: session.regions.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

async function processOCRAsync(
  sessionId: string,
  imageId: string,
  regions: Region[]
) {
  const session = sessions.get(sessionId);
  if (!session) return;

  try {
    // In production, this should be retrieved from a database
    // For now, we'll need to pass the actual filename or store it during upload
    const uploadDir = getUploadDir();
    
    // Look for files that start with the imageId (UUID)
    const fs = await import('fs/promises');
    const files = await fs.readdir(uploadDir);
    const imageFile = files.find(file => file.startsWith(imageId + '_'));
    
    if (!imageFile) {
      throw new Error('Image file not found');
    }
    
    const imagePath = path.join(uploadDir, imageFile);

    // Validate regions
    const validation = await ImageProcessingService.validateRegions(imagePath, regions);
    if (!validation.valid) {
      throw new Error(`Invalid regions: ${validation.errors.join(', ')}`);
    }

    // Crop regions
    const processedRegions = await ImageProcessingService.cropRegions(imagePath, regions);

    // Process regions in parallel with concurrency limit
    const concurrencyLimit = parseInt(process.env.OCR_CONCURRENCY_LIMIT || '3'); // Adjust based on API rate limits
    const processRegion = async (processedRegion: ProcessedRegion) => {
      const startTime = Date.now();
      try {
        // Optimize image for OCR
        const optimizedBuffer = await ImageProcessingService.optimizeForOCR(
          processedRegion.imageBuffer
        );

        // Create vision request
        const visionRequest: VisionRequest = {
          image: optimizedBuffer,
          prompt: 'You are a professional OCR assistant. Transcribe only the text that appears in the supplied image. Return plain UTF-8 with no extra markup.',
        };

        // Process with retry and timeout
        const text = await withTimeout(
          retryWithBackoff(
            () => geminiService.processOCR(visionRequest),
            undefined,
            (attempt, error) => {
              console.log(`Retry attempt ${attempt} for region ${processedRegion.regionId}:`, error.message);
              // Update session with retry status
              const currentSession = sessions.get(sessionId);
              if (currentSession) {
                const regionResult = currentSession.results.find(r => r.regionId === processedRegion.regionId);
                if (regionResult && regionResult.error) {
                  regionResult.error.message = `Retry attempt ${attempt}: ${error.message}`;
                }
              }
            }
          ),
          geminiConfig.timeout,
          'OCR processing timed out'
        );

        // Return successful result
        return {
          regionId: processedRegion.regionId,
          text,
          processingTime: Date.now() - startTime,
        };
      } catch (error: unknown) {
        const err = error as Error & { code?: string };
        // Return error result
        return {
          regionId: processedRegion.regionId,
          text: '',
          processingTime: Date.now() - startTime,
          error: {
            code: err.code || 'PROCESSING_ERROR',
            message: err.message || 'Failed to process region',
            retryable: false,
          },
        };
      }
    };

    // Process regions in batches with concurrency limit
    const processBatch = async (batch: ProcessedRegion[]) => {
      return Promise.all(batch.map(processRegion));
    };

    // Split regions into batches
    const batches = [];
    for (let i = 0; i < processedRegions.length; i += concurrencyLimit) {
      batches.push(processedRegions.slice(i, i + concurrencyLimit));
    }

    // Process all batches sequentially, but regions within each batch in parallel
    for (const batch of batches) {
      const batchResults = await processBatch(batch);
      
      // Add results to session as they complete
      batchResults.forEach(result => {
        session.results.push(result);
      });
    }

    // Update session status
    session.status = 'completed';
    session.completedAt = new Date();
  } catch (error) {
    console.error('OCR processing error:', error);
    session.status = 'failed';
    session.completedAt = new Date();
  }

  // Clean up old sessions (keep for 1 hour)
  cleanupOldSessions();
}

function cleanupOldSessions() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  for (const [sessionId, session] of sessions) {
    if (session.createdAt < oneHourAgo) {
      sessions.delete(sessionId);
    }
  }
}