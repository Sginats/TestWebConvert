import { z } from 'zod';

const envSchema = z.object({
  // Base
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // Auth
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1),
  
  // Redis / Queue
  REDIS_URL: z.string().url(),
  
  // Storage (Local fallback)
  STORAGE_DIR: z.string().default('./storage'),
  
  // R2 / S3 (Optional for production)
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_ENDPOINT: z.string().url().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),
  
  // Payments
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

const skipValidation = 
  process.env.SKIP_ENV_VALIDATION === 'true' || 
  process.env.NEXT_PHASE === 'phase-production-build';

export const env = skipValidation 
  ? (process.env as any)
  : envSchema.parse(process.env);

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
