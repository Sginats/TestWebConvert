import { createRedisConnection } from './queue';
import IORedis from 'ioredis';

let redis: IORedis | null = null;
const memoryStore = new Map<string, { count: number; expires: number }>();

export function getRedis() {
  if (!redis) {
    redis = createRedisConnection();
  }
  return redis;
}

export async function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 60_000,
): Promise<boolean> {
  const fullKey = `ratelimit:${key}`;
  
  try {
    const r = getRedis();
    const count = await r.incr(fullKey);
    if (count === 1) {
      await r.pexpire(fullKey, windowMs);
    }
    
    return count <= maxAttempts;
  } catch (err) {
    console.warn('Redis rate limit error, falling back to memory:', (err as Error).message);
    
    // In-memory fallback
    const now = Date.now();
    const entry = memoryStore.get(fullKey);
    
    if (!entry || entry.expires < now) {
      memoryStore.set(fullKey, { count: 1, expires: now + windowMs });
      return true;
    }
    
    entry.count += 1;
    return entry.count <= maxAttempts;
  }
}

export async function clearRateLimit(key: string) {
  const fullKey = `ratelimit:${key}`;
  try {
    const r = getRedis();
    await r.del(fullKey);
  } catch {
    // ignore
  }
  memoryStore.delete(fullKey);
}
