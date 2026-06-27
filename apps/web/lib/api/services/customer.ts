import { z } from 'zod';
import { apiFetch, apiRequest } from '../client';
import { addressSchema, customerSchema } from '../schemas';

export const customerService = {
  // ── Auth ─────────────────────────────────────────────────────────────

  async login(email: string, password: string) {
    return apiFetch(z.object({ principal: z.object({ id: z.string(), kind: z.string() }) }), {
      method: 'POST',
      path: '/v1/auth/customer/login',
      body: { email, password },
    });
  },

  async logout() {
    await apiRequest({ method: 'POST', path: '/v1/auth/logout' });
  },

  // ── Profile ──────────────────────────────────────────────────────────

  async me() {
    return apiFetch(customerSchema, { path: '/v1/customer/me' });
  },

  async updateProfile(input: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    marketingOptIn?: boolean;
  }) {
    return apiFetch(customerSchema, {
      method: 'PATCH',
      path: '/v1/customer/me',
      body: input,
    });
  },

  async changePassword(currentPassword: string, newPassword: string) {
    await apiRequest({
      method: 'POST',
      path: '/v1/customer/me/change-password',
      body: { currentPassword, newPassword },
    });
  },

  async deactivate() {
    await apiRequest({ method: 'POST', path: '/v1/customer/me/deactivate' });
  },

  // ── Registration / verification / reset ──────────────────────────────

  async register(input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    marketingOptIn?: boolean;
  }) {
    return apiFetch(customerSchema, {
      method: 'POST',
      path: '/v1/customer/register',
      body: input,
    });
  },

  async verifyEmail(token: string) {
    await apiRequest({
      method: 'POST',
      path: '/v1/customer/verify-email',
      body: { token },
    });
  },

  async requestPasswordReset(email: string) {
    await apiRequest({
      method: 'POST',
      path: '/v1/customer/request-password-reset',
      body: { email },
    });
  },

  async completePasswordReset(token: string, password: string) {
    await apiRequest({
      method: 'POST',
      path: '/v1/customer/complete-password-reset',
      body: { token, password },
    });
  },

  // ── Addresses ────────────────────────────────────────────────────────

  async listAddresses() {
    return apiFetch(z.array(addressSchema), { path: '/v1/customer/me/addresses' });
  },

  async addAddress(input: Record<string, unknown>) {
    return apiFetch(addressSchema, {
      method: 'POST',
      path: '/v1/customer/me/addresses',
      body: input,
    });
  },

  async updateAddress(id: string, input: Record<string, unknown>) {
    return apiFetch(addressSchema, {
      method: 'PATCH',
      path: `/v1/customer/me/addresses/${encodeURIComponent(id)}`,
      body: input,
    });
  },

  async deleteAddress(id: string) {
    return apiFetch(addressSchema, {
      method: 'DELETE',
      path: `/v1/customer/me/addresses/${encodeURIComponent(id)}`,
    });
  },

  // ── Sessions ─────────────────────────────────────────────────────────

  async listSessions() {
    return apiFetch(
      z.array(
        z.object({
          id: z.string(),
          userAgent: z.string().nullable(),
          ipAddress: z.string().nullable(),
          expiresAt: z.string(),
          createdAt: z.string(),
        }),
      ),
      { path: '/v1/customer/me/sessions' },
    );
  },

  async revokeSession(id: string) {
    await apiRequest({
      method: 'DELETE',
      path: `/v1/customer/me/sessions/${encodeURIComponent(id)}`,
    });
  },
};
