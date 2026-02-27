// Simple in-memory rate limiter for dev. Replace with Redis-backed solution in production.
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }

  if (entry.count >= maxAttempts) {
    return false; // rate limited
  }

  entry.count++;
  return true;
}

export function clearRateLimit(key: string) {
  attempts.delete(key);
}
