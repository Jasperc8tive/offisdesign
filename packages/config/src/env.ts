import { z } from 'zod';

/**
 * Shared environment schema. Apps extend this with their own additional keys.
 * Configuration is read from environment variables only (12-factor). No
 * environment-specific code branches.
 */
const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // `production`/`development` are accepted as aliases so the common spelling
  // doesn't crash the process at boot.
  APP_ENV: z
    .preprocess(
      (v) => (v === 'production' ? 'prod' : v === 'development' ? 'dev' : v),
      z.enum(['local', 'dev', 'staging', 'prod']),
    )
    .default('local'),
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

const TRUTHY = ['true', '1', 'yes', 'on'];
const FALSY = ['false', '0', 'no', 'off'];

/** Boolean env flag. Unknown spellings are rejected rather than read as false. */
const boolish = z.union([z.boolean(), z.string()]).transform((v, ctx) => {
  if (typeof v === 'boolean') return v;
  const s = v.trim().toLowerCase();
  if (TRUTHY.includes(s)) return true;
  if (FALSY.includes(s)) return false;
  ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Expected a boolean, got "${v}"` });
  return z.NEVER;
});

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
  TAX_FLAT_RATE_BPS: z.coerce.number().int().min(0).max(10_000).default(750), // 7.5% NG VAT

  // Shipping — provider toggle.
  SHIPPING_PROVIDER: z.enum(['flat', 'external']).default('flat'),
  // All shipping amounts are in minor units (kobo).
  SHIPPING_FLAT_AMOUNT: z.coerce.number().int().min(0).default(0),
  /** Subtotal at or above which standard delivery is free. Unset = never free. */
  SHIPPING_FREE_THRESHOLD: z.coerce.number().int().min(0).optional(),
  /** Added to standard for express delivery. 0 = express not offered. */
  SHIPPING_EXPRESS_SURCHARGE: z.coerce.number().int().min(0).default(0),

  // Cart / checkout TTLs
  CART_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CHECKOUT_TTL_MIN: z.coerce.number().int().positive().default(30),
  CART_ABANDON_AFTER_HOURS: z.coerce.number().int().positive().default(24),
} as const;

export type ApiEnv = AppEnv<typeof apiEnvShape>;

/** Values that are clearly copied from an example file rather than generated. */
const PLACEHOLDER_SECRET = /change-?me|replace|example|placeholder|secret-secret/i;

/**
 * Conditional requirements that can't be expressed per-field:
 *   - PAYMENT_PROVIDER=stripe ⇒ STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET
 *   - STORAGE_DRIVER=s3      ⇒ S3_BUCKET + S3_REGION + S3_ACCESS_KEY_ID + S3_SECRET_ACCESS_KEY
 *   - EMAIL_TRANSPORT=smtp   ⇒ SMTP_HOST + SMTP_PORT + SMTP_USER + SMTP_PASSWORD
 *   - RATE_LIMIT_AUTH must be < RATE_LIMIT_DEFAULT
 *   - production (APP_ENV=prod or NODE_ENV=production) fails closed: real
 *     payments, secure cookies, distinct non-placeholder JWT secrets, S3
 *     storage, SMTP email and no public OpenAPI docs
 * These are checked at boot so a misconfigured deploy fails immediately
 * rather than at the first customer transaction.
 */
function assertApiInvariants(env: ApiEnv): void {
  const missing: string[] = [];

  if (env.PAYMENT_PROVIDER === 'stripe') {
    if (!env.STRIPE_SECRET_KEY)
      missing.push('STRIPE_SECRET_KEY (required when PAYMENT_PROVIDER=stripe)');
    if (!env.STRIPE_WEBHOOK_SECRET)
      missing.push('STRIPE_WEBHOOK_SECRET (required when PAYMENT_PROVIDER=stripe)');
  }

  if (env.STORAGE_DRIVER === 's3') {
    if (!env.S3_BUCKET) missing.push('S3_BUCKET (required when STORAGE_DRIVER=s3)');
    if (!env.S3_REGION) missing.push('S3_REGION (required when STORAGE_DRIVER=s3)');
    if (!env.S3_ACCESS_KEY_ID) missing.push('S3_ACCESS_KEY_ID (required when STORAGE_DRIVER=s3)');
    if (!env.S3_SECRET_ACCESS_KEY)
      missing.push('S3_SECRET_ACCESS_KEY (required when STORAGE_DRIVER=s3)');
  }

  if (env.EMAIL_TRANSPORT === 'smtp') {
    if (!env.SMTP_HOST) missing.push('SMTP_HOST (required when EMAIL_TRANSPORT=smtp)');
    if (!env.SMTP_PORT) missing.push('SMTP_PORT (required when EMAIL_TRANSPORT=smtp)');
    if (!env.SMTP_USER) missing.push('SMTP_USER (required when EMAIL_TRANSPORT=smtp)');
    if (!env.SMTP_PASSWORD) missing.push('SMTP_PASSWORD (required when EMAIL_TRANSPORT=smtp)');
  }

  if (env.RATE_LIMIT_AUTH >= env.RATE_LIMIT_DEFAULT) {
    missing.push(
      `RATE_LIMIT_AUTH (${env.RATE_LIMIT_AUTH}) must be strictly less than RATE_LIMIT_DEFAULT (${env.RATE_LIMIT_DEFAULT})`,
    );
  }

  const isProd = env.APP_ENV === 'prod' || env.NODE_ENV === 'production';
  if (isProd) {
    if (!env.COOKIE_DOMAIN) {
      missing.push('COOKIE_DOMAIN (required in production so cross-subdomain auth works)');
    }
    if (env.PAYMENT_PROVIDER === 'mock') {
      missing.push(
        'PAYMENT_PROVIDER (mock is not allowed in production — orders would not be charged)',
      );
    }
    if (!env.COOKIE_SECURE) {
      missing.push('COOKIE_SECURE (must be true in production)');
    }
    if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
      missing.push('JWT_REFRESH_SECRET (must differ from JWT_ACCESS_SECRET in production)');
    }
    for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
      if (PLACEHOLDER_SECRET.test(env[key])) {
        missing.push(`${key} (looks like a placeholder — generate a random secret)`);
      }
    }
    if (env.STORAGE_DRIVER !== 's3') {
      missing.push('STORAGE_DRIVER (must be s3 in production — local disk is lost on redeploy)');
    }
    if (env.EMAIL_TRANSPORT !== 'smtp') {
      missing.push('EMAIL_TRANSPORT (must be smtp in production — log drops customer email)');
    }
    if (env.OPENAPI_ENABLED) {
      missing.push('OPENAPI_ENABLED (must be false in production)');
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n${missing.map((m) => `  ${m}`).join('\n')}`,
    );
  }
}

export function loadApiEnv(): ApiEnv {
  const env = loadEnv(apiEnvShape);
  assertApiInvariants(env);
  return env;
}
