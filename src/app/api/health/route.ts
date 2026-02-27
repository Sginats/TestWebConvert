import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRedisConnection } from '@/lib/queue';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      REDIS_URL: !!process.env.REDIS_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    },
  };

  try {
    // DB Check
    await prisma.$queryRaw`SELECT 1`;
    status.database = 'healthy';
  } catch (e) {
    status.database = 'unhealthy';
    status.databaseError = (e as Error).message;
  }

  try {
    // Redis Check
    const redis = createRedisConnection();
    await redis.ping();
    status.redis = 'healthy';
    redis.disconnect();
  } catch (e) {
    status.redis = 'unhealthy';
    status.redisError = (e as Error).message;
  }

  const isHealthy = status.database === 'healthy' && status.redis === 'healthy';

  return NextResponse.json(status, { status: isHealthy ? 200 : 503 });
}
