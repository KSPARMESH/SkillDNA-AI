export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(private capacity: number = 60, private refillRatePerSec: number = 1) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<boolean> {
    const now = Date.now();
    const elapsedSec = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillRatePerSec);
    this.lastRefill = now;

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    console.warn('[RateLimiter] Token limit reached. Delaying job dispatch...');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return this.acquire();
  }
}
