import type { Customer, CustomerSession } from '@offisdesign/database';

/**
 * Response shapes for customer data. Customer rows must never leave the API
 * with `passwordHash`, and sessions never with their refresh-token JTI.
 */
export type PublicCustomer = Omit<Customer, 'passwordHash'>;

export function toPublicCustomer(customer: Customer): PublicCustomer;
export function toPublicCustomer(customer: Customer | null): PublicCustomer | null;
export function toPublicCustomer(customer: Customer | null): PublicCustomer | null {
  if (!customer) return null;
  const { passwordHash: _omit, ...rest } = customer;
  return rest;
}

export type PublicSession = Omit<CustomerSession, 'refreshTokenJti'> & { isCurrent: boolean };

export function toPublicSession(
  session: CustomerSession,
  currentSessionId?: string,
): PublicSession {
  const { refreshTokenJti: _omit, ...rest } = session;
  return { ...rest, isCurrent: session.id === currentSessionId };
}
