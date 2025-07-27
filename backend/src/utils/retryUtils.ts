import { RetryConfig } from '../types';

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 2000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'RESOURCE_EXHAUSTED',
    'DEADLINE_EXCEEDED',
    'UNAVAILABLE',
    'INTERNAL',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
  ],
};

/**
 * Calculate delay for exponential backoff
 * @param attempt - Current attempt number (1-based)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

/**
 * Check if an error is retryable
 * @param error - Error to check
 * @param config - Retry configuration
 * @returns True if error is retryable
 */
export function isRetryableError(
  error: any,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): boolean {
  if (!error) return false;

  // Check if error explicitly marked as retryable
  if (error.retryable === true) return true;
  if (error.retryable === false) return false;

  // Check error code
  const errorCode = error.code || '';
  const errorMessage = error.message || '';

  return config.retryableErrors.some(
    retryableError =>
      errorCode.includes(retryableError) ||
      errorMessage.includes(retryableError)
  );
}

/**
 * Sleep for specified milliseconds
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param config - Retry configuration
 * @param onRetry - Optional callback for retry events
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: any) => void
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt >= config.maxAttempts || !isRetryableError(error, config)) {
        throw error;
      }

      // Calculate delay
      const delay = calculateBackoffDelay(attempt, config);

      // Notify about retry
      if (onRetry) {
        onRetry(attempt, error);
      }

      // Wait before retry
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Create a timeout promise
 * @param ms - Timeout in milliseconds
 * @param message - Error message for timeout
 */
export function createTimeout(ms: number, message = 'Operation timed out'): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message);
      (error as any).code = 'TIMEOUT';
      (error as any).retryable = true;
      reject(error);
    }, ms);
  });
}

/**
 * Run a promise with timeout
 * @param promise - Promise to run
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Error message for timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string
): Promise<T> {
  return Promise.race([
    promise,
    createTimeout(timeoutMs, timeoutMessage),
  ]);
}