import { logger } from './logger';

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        logger.error(`Failed after ${maxRetries} retries: ${lastError.message}`);
        throw lastError;
      }

      const delayMs = Math.pow(2, attempt) * 1000;
      logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delayMs}ms: ${lastError.message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError!;
}
