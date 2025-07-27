import { UploadResponse, ProcessOCRRequest, ProcessOCRResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      throw new ApiError(
        'Network error occurred',
        'NETWORK_ERROR',
        response.status,
        true
      );
    }

    throw new ApiError(
      errorData.error?.message || 'Request failed',
      errorData.error?.code || 'UNKNOWN_ERROR',
      response.status,
      errorData.error?.retryable || false
    );
  }

  const data = await response.json();
  if (data.success === false) {
    throw new ApiError(
      data.error?.message || 'Request failed',
      data.error?.code || 'UNKNOWN_ERROR',
      response.status,
      data.error?.retryable || false
    );
  }

  return data.data || data;
}

export const api = {
  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<UploadResponse>(response);
  },

  async processOCR(request: ProcessOCRRequest): Promise<ProcessOCRResponse> {
    const response = await fetch(`${API_BASE_URL}/ocr/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return handleResponse<ProcessOCRResponse>(response);
  },

  async getOCRStatus(sessionId: string): Promise<ProcessOCRResponse & { status?: string }> {
    const response = await fetch(`${API_BASE_URL}/ocr/status/${sessionId}`);
    return handleResponse<ProcessOCRResponse & { status?: string }>(response);
  },

  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(response);
  },
};

export { ApiError };