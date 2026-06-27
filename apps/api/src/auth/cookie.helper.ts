import type { Response } from 'express';
import type { ApiEnv } from '@offisdesign/config';

export const ACCESS_COOKIE = 'offis_at';
export const REFRESH_COOKIE = 'offis_rt';

interface CookieDeps {
  res: Response;
  env: ApiEnv;
}

export function setAuthCookies(
  { res, env }: CookieDeps,
  accessToken: string,
  refreshToken: string,
  accessTtlSec: number,
  refreshTtlSec: number,
): void {
  const common = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    path: '/',
  } as const;
  res.cookie(ACCESS_COOKIE, accessToken, { ...common, maxAge: accessTtlSec * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...common, maxAge: refreshTtlSec * 1000 });
}

export function clearAuthCookies({ res, env }: CookieDeps): void {
  const common = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    path: '/',
  } as const;
  res.clearCookie(ACCESS_COOKIE, common);
  res.clearCookie(REFRESH_COOKIE, common);
}
