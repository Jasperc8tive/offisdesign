import { afterEach, describe, expect, it } from 'vitest';
import { loadApiEnv } from './env.js';

const ORIGINAL = { ...process.env };
afterEach(() => {
  process.env = { ...ORIGINAL };
});

function withEnv(vars: Record<string, string>) {
  process.env = { PATH: ORIGINAL.PATH ?? '', ...vars };
}

const LOCAL = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'ci-access-secret-ci-access-secret-ci-access',
  JWT_REFRESH_SECRET: 'ci-refresh-secret-ci-refresh-secret-ci-refresh',
};

const PROD = {
  ...LOCAL,
  NODE_ENV: 'production',
  APP_ENV: 'prod',
  JWT_ACCESS_SECRET: 'q8Vt2mZ1x7Lk4Pw9Rb6Hn3Js5Df0Ga8Ce2Yu7Io1',
  JWT_REFRESH_SECRET: 'Zr5Nb8Wq2Lp6Xt9Mv3Kc7Hj1Fs4Dg0Ay8Ue2Ti6Oo',
  COOKIE_DOMAIN: '.offisdesign.com',
  COOKIE_SECURE: 'true',
  PAYMENT_PROVIDER: 'stripe',
  STRIPE_SECRET_KEY: 'sk_live_x',
  STRIPE_WEBHOOK_SECRET: 'whsec_x',
  STORAGE_DRIVER: 's3',
  S3_BUCKET: 'b',
  S3_REGION: 'r',
  S3_ACCESS_KEY_ID: 'k',
  S3_SECRET_ACCESS_KEY: 's',
  EMAIL_TRANSPORT: 'smtp',
  SMTP_HOST: 'smtp.example.ng',
  SMTP_PORT: '587',
  SMTP_USER: 'u',
  SMTP_PASSWORD: 'p',
  OPENAPI_ENABLED: 'false',
};

describe('loadApiEnv', () => {
  it('boots with local/CI defaults', () => {
    withEnv(LOCAL);
    const env = loadApiEnv();
    expect(env.APP_ENV).toBe('local');
    expect(env.PAYMENT_PROVIDER).toBe('mock');
    expect(env.TAX_FLAT_RATE_BPS).toBe(750);
    expect(env.SHIPPING_EXPRESS_SURCHARGE).toBe(0);
    expect(env.SHIPPING_FREE_THRESHOLD).toBeUndefined();
  });

  it('accepts a fully configured production env', () => {
    withEnv(PROD);
    expect(loadApiEnv().APP_ENV).toBe('prod');
  });

  it('accepts APP_ENV=production as an alias', () => {
    withEnv({ ...PROD, APP_ENV: 'production' });
    expect(loadApiEnv().APP_ENV).toBe('prod');
  });

  it('reports every production violation at once', () => {
    withEnv({
      ...LOCAL,
      NODE_ENV: 'production',
      JWT_ACCESS_SECRET: 'change-me-change-me-change-me-change-me-change-me-32',
      JWT_REFRESH_SECRET: 'change-me-change-me-change-me-change-me-change-me-32',
    });
    let message = '';
    try {
      loadApiEnv();
    } catch (err) {
      message = (err as Error).message;
    }
    for (const key of [
      'COOKIE_DOMAIN',
      'PAYMENT_PROVIDER',
      'COOKIE_SECURE',
      'JWT_REFRESH_SECRET (must differ',
      'JWT_ACCESS_SECRET (looks like a placeholder',
      'STORAGE_DRIVER',
      'EMAIL_TRANSPORT',
      'OPENAPI_ENABLED',
    ]) {
      expect(message).toContain(key);
    }
  });

  it('enforces production rules when only APP_ENV=prod is set', () => {
    withEnv({ ...PROD, NODE_ENV: 'development', PAYMENT_PROVIDER: 'mock' });
    expect(() => loadApiEnv()).toThrow(/PAYMENT_PROVIDER/);
  });

  it.each(['TRUE', '1', 'yes', 'On'])('reads %s as true', (v) => {
    withEnv({ ...LOCAL, COOKIE_SECURE: v });
    expect(loadApiEnv().COOKIE_SECURE).toBe(true);
  });

  it('rejects unknown boolean spellings instead of treating them as false', () => {
    withEnv({ ...LOCAL, COOKIE_SECURE: 'ture' });
    expect(() => loadApiEnv()).toThrow(/COOKIE_SECURE/);
  });
});
