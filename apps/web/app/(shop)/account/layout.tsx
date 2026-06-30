'use client';

import { usePathname } from 'next/navigation';
import { AccountShell } from '../../../components/account/account-shell';
import { AuthShell } from '../../../components/account/auth-shell';

// Unauthenticated entry points get the centered auth card; everything else in
// /account gets the signed-in sidebar shell.
const AUTH_PREFIXES = ['/account/login', '/account/register', '/account/reset', '/account/verify'];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const isAuth = AUTH_PREFIXES.some((p) => pathname.startsWith(p));
  return isAuth ? <AuthShell>{children}</AuthShell> : <AccountShell>{children}</AccountShell>;
}
