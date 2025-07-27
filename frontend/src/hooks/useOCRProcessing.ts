import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/services/api';
import { OCRResult, ProcessOCRRequest, ProcessOCRResponse } from '@/types';

interface UseOCRProcessingReturn {
  processOCR: (imageId: string, regions: any[]) => Promise<void>;
  results: OCRResult[];
  isProcessing: boolean;
  error: string | null;
  sessionId: string | null;
  clearResults: () => void;
}

export const useOCRProcessing = (): UseOCRProcessingReturn => {
  const [results, setResults] = useState<OCRResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setSessionId(null);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async (sessionId: string, totalRegions: number) => {
    try {
      const statusResponse = await api.getOCRStatus(sessionId);
      
      // Update results
      setResults(statusResponse.results);

      // Check if processing is complete
      const isComplete = statusResponse.status === 'completed' || 
                        statusResponse.status === 'failed' ||
                        (statusResponse.results.length === totalRegions && totalRegions > 0);
      
      if (isComplete) {
        setIsProcessing(false);
        
        // Clear polling interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('Failed to poll OCR status:', err);
      // Continue polling even if one request fails
    }
  }, []);

  const processOCR = useCallback(async (imageId: string, regions: any[]) => {
    setIsProcessing(true);
    setError(null);
    clearResults();

    try {
      const request: ProcessOCRRequest = {
        imageId,
        regions,
      };

      const response: ProcessOCRResponse = await api.processOCR(request);
      setSessionId(response.sessionId);

      // Start polling for results
      pollingIntervalRef.current = setInterval(() => {
        pollStatus(response.sessionId, regions.length);
      }, 1000); // Poll every second

      // Initial poll
      await pollStatus(response.sessionId, regions.length);
    } catch (err: any) {
      setError(err.message || 'Failed to process OCR');
      setIsProcessing(false);
      
      // Clear polling on error
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [clearResults, pollStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // Return cleanup function for component unmount
  return {
    processOCR,
    results,
    isProcessing,
    error,
    sessionId,
    clearResults,
  };
};