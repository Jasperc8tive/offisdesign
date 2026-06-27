import { z } from 'zod';

/**
 * Shared environment schema. Apps extend this with their own additional keys.
 * Configuration is read from environment variables only (12-factor). No
 * environment-specific code branches.
 */
const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(['local', 'dev', 'staging', 'prod']).default('local'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

export type BaseEnv = z.infer<typeof baseSchema>;
export type AppEnv<T extends z.ZodRawShape = z.ZodRawShape> = BaseEnv & z.infer<z.ZodObject<T>>;

export function loadEnv<T extends z.ZodRawShape>(extras?: T): AppEnv<T> {
  const schema = extras ? baseSchema.extend(extras) : baseSchema;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data as AppEnv<T>;
}

// ──────────────────────────────────────────────────────────────────────────
// API-specific schema (apps/api). Exported so other tooling can reuse it.
// ──────────────────────────────────────────────────────────────────────────

const boolish = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === 'boolean' ? v : v === 'true'));

export const apiEnvShape = {
  // Server
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_HOST: z.string().default('0.0.0.0'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  WEB_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_PUBLIC_URL: z.string().url().default('http://localhost:3001'),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),

  // Redis
  REDIS_URL: z.string().url(),

  // Auth — JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL_SEC: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_TTL_SEC: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 30),

  // Auth — cookies
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: boolish.default(false),
  COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).default('lax'),

  // Bcrypt
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),

  // Rate limiting (per minute per IP)
  RATE_LIMIT_DEFAULT: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_AUTH: z.coerce.number().int().positive().default(10),

  // Storage
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./.storage'),
  STORAGE_PUBLIC_BASE_URL: z.string().url().default('http://localhost:4000/media'),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: boolish.default(false),

  // BullMQ
  QUEUE_PREFIX: z.string().default('offis'),
  QUEUE_DEFAULT_ATTEMPTS: z.coerce.number().int().positive().default(5),

  // OpenAPI
  OPENAPI_ENABLED: boolish.default(true),

  // Payments — Stripe
  PAYMENT_PROVIDER: z.enum(['stripe', 'mock']).default('mock'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Email transport
  EMAIL_TRANSPORT: z.enum(['log', 'smtp']).default('log'),
  EMAIL_FROM: z.string().email().default('no-reply@offisdesign.local'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),

  // Tax — provider toggle. Mock = flat rate.
  TAX_PROVIDER: z.enum(['flat', 'external']).default('flat'),
  TAX_FLAT_RATE_BPS: z.coerce.number().int().min(0).max(10_000).default(2000), // 20% VAT

  // Shipping — provider toggle.
  SHIPPING_PROVIDER: z.enum(['flat', 'external']).default('flat'),
  SHIPPING_FLAT_AMOUNT: z.coerce.number().int().min(0).default(0),

  // Cart / checkout TTLs
  CART_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CHECKOUT_TTL_MIN: z.coerce.number().int().positive().default(30),
  CART_ABANDON_AFTER_HOURS: z.coerce.number().int().positive().default(24),
} as const;

export type ApiEnv = AppEnv<typeof apiEnvShape>;

export function loadApiEnv(): ApiEnv {
  return loadEnv(apiEnvShape);
}
