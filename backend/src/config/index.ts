import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  
  // Database Configuration
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/balancevault?schema=public'),
  
  // Redis Configuration
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform((val) => parseInt(val, 10)).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  
  // Security & Authentication Secrets
  JWT_SECRET: z.string().min(16).default('balancevault_super_jwt_secret_development_key_32_bytes_long!'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(16).default('balancevault_super_refresh_token_dev_key_32_bytes!'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  BOOTSTRAP_SECRET: z.string().min(16).default('balancevault_admin_bootstrap_secret_token_dev!'),
  
  // Rate Limiting
  RATE_LIMIT_AUTH_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('60000'),
  RATE_LIMIT_AUTH_MAX: z.string().transform((val) => parseInt(val, 10)).default('5'),
  RATE_LIMIT_API_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('60000'),
  RATE_LIMIT_API_MAX: z.string().transform((val) => parseInt(val, 10)).default('100'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
