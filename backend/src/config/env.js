const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

// Load environment variables from server/.env, falling back to root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().default('file:./dev.db'),
  TMDB_API_KEY: z.string().optional().default(process.env.REACT_APP_API_KEY || ''),
  CLERK_SECRET_KEY: z.string().optional().default(process.env.CLERK_SECRET_KEY || ''),
  CLERK_PUBLISHABLE_KEY: z.string().optional().default(process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || ''),
  CLERK_JWT_KEY: z.string().optional().default(process.env.CLERK_JWT_KEY || ''),
  TRUST_PROXY: z.string().optional().default(process.env.TRUST_PROXY || ''),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  REDIS_URL: z.string().optional().default(process.env.REDIS_URL || ''),
  CACHE_TTL_DEFAULT_SEC: z.coerce.number().default(3600), // 1 hour
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(500),
});


const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

module.exports = {
  env: parsed.data,
};
