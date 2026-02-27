import { createRedisConnection } from './queue';
import IORedis from 'ioredis';

let redis: IORedis | null = null;

function getRedis() {
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
    console.error('Rate limit error:', err);
    return true; // fail open in case of redis error
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
}
