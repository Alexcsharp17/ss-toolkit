export interface RetryPolicy {
  execute<T>(fn: () => Promise<T>): Promise<T>;
}

export interface RetryPolicyOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

/**
 * Simple retry policy with exponential backoff
 */
export class SimpleRetryPolicy implements RetryPolicy {
  private readonly maxAttempts: number;
  private readonly delayMs: number;
  private readonly backoffMultiplier: number;

  constructor(options: RetryPolicyOptions = {}) {
    this.maxAttempts = options.maxAttempts ?? 3;
    this.delayMs = options.delayMs ?? 1000;
    this.backoffMultiplier = options.backoffMultiplier ?? 2;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.delayMs;

    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < this.maxAttempts - 1) {
          await new Promise((r) => setTimeout(r, delay));
          delay *= this.backoffMultiplier;
        }
      }
    }

    throw lastError ?? new Error('Retry failed');
  }
}
