import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { GeminiConfig, VisionRequest, OCRResult } from '../types';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = config;
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.model });
  }

  /**
   * Process image for OCR using Gemini
   * @param request - Vision request with image and prompt
   * @returns OCR result with extracted text
   */
  async processOCR(request: VisionRequest): Promise<string> {
    try {
      // Convert buffer to base64
      const base64Image = request.image.toString('base64');

      // Create the prompt for OCR (based on your example)
      const prompt = request.prompt || 'You are a professional OCR assistant. Transcribe only the text that appears in the supplied image. Return plain UTF-8 with no extra markup.';

      // Create a promise with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${this.config.timeout}ms`));
        }, this.config.timeout);
      });

      // Send request to Gemini with timeout
      const resultPromise = this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Image,
          },
        },
      ]);

      const result = await Promise.race([resultPromise, timeoutPromise]);
      const response = await result.response;
      const text = response.text();

      return text.trim();
    } catch (error: unknown) {
      const err = error as Error & { code?: string };
      console.error('Gemini API error:', err);
      
      // Determine if error is retryable
      const retryableErrors = [
        'RESOURCE_EXHAUSTED',
        'DEADLINE_EXCEEDED',
        'UNAVAILABLE',
        'INTERNAL',
      ];

      const isRetryable = err.message && retryableErrors.some(
        errType => err.message.includes(errType)
      );

      throw {
        message: err.message || 'Failed to process image with Gemini',
        code: err.code || 'GEMINI_ERROR',
        retryable: isRetryable,
      };
    }
  }

  /**
   * Batch process multiple images
   * @param requests - Array of vision requests
   * @returns Array of OCR results
   */
  async batchProcessOCR(
    requests: Array<VisionRequest & { regionId: string }>
  ): Promise<OCRResult[]> {
    const results: OCRResult[] = [];

    // Process requests in parallel with concurrency limit
    const concurrencyLimit = 3;
    const chunks = this.chunkArray(requests, concurrencyLimit);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (request) => {
        const startTime = Date.now();
        
        try {
          const text = await this.processOCR(request);
          
          return {
            regionId: request.regionId,
            text,
            processingTime: Date.now() - startTime,
          } as OCRResult;
        } catch (error: unknown) {
          const err = error as Error & { code?: string; retryable?: boolean };
          return {
            regionId: request.regionId,
            text: '',
            processingTime: Date.now() - startTime,
            error: {
              code: err.code || 'PROCESSING_ERROR',
              message: err.message || 'Failed to process region',
              retryable: err.retryable || false,
            },
          } as OCRResult;
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Check if Gemini API is available
   * @returns True if API is accessible
   */
  async checkHealth(): Promise<boolean> {
    try {
      // Try a simple generation to test the API
      const result = await this.model.generateContent('Hello');
      await result.response;
      return true;
    } catch (error) {
      console.error('Gemini health check failed:', error);
      return false;
    }
  }

  /**
   * Utility to chunk array for batch processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}