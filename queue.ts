import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

export function createRedisConnection() {
  return new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
  });
}

export const CONVERSION_QUEUE = 'conversion';

let queue: Queue | null = null;

export function getConversionQueue(): Queue {
  if (!queue) {
    queue = new Queue(CONVERSION_QUEUE, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 100 },
      },
    });
  }
  return queue;
}

export interface ConversionJobData {
  jobId: string;
  userId: string;
  inputPath: string;
  inputMime: string;
  outputMime: string;
  costTokens: number;
  resizeWidth?: number;
  resizeHeight?: number;
}

export async function enqueueConversionJob(data: ConversionJobData) {
  const queue = getConversionQueue();
  return queue.add('convert', data, { jobId: data.jobId });
}

export async function removeJobFromQueue(jobId: string) {
  const queue = getConversionQueue();
  const job = await queue.getJob(jobId);
  if (job) {
    await job.remove();
    return true;
  }
  return false;
}
