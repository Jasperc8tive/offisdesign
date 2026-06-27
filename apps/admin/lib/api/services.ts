import { z } from 'zod';
import { apiFetch, apiRequest } from './client';
import {
  adminCustomerSchema,
  adminOrderSchema,
  adminProductSchema,
  auditEntrySchema,
  cmsPageSchema,
  featureFlagSchema,
  lowStockRowSchema,
  pageSchema,
  principalSchema,
  queueHealthSchema,
} from './schemas';

/**
 * Service modules grouped by domain. Each function is a thin call onto a
 * single backend endpoint — the admin app holds no business logic, only
 * presentation and orchestration of these calls.
 */

export const authService = {
  login(email: string, password: string) {
    return apiFetch(z.object({ principal: principalSchema }), {
      method: 'POST',
      path: '/v1/auth/admin/login',
      body: { email, password },
    });
  },
  logout() {
    return apiRequest({ method: 'POST', path: '/v1/auth/logout' });
  },
  me() {
    return apiFetch(z.object({ principal: principalSchema }), { path: '/v1/auth/me' });
  },
};

export const catalogService = {
  listProducts(params: { page?: number; pageSize?: number; q?: string; status?: string } = {}) {
    return apiFetch(pageSchema(adminProductSchema), {
      path: '/v1/admin/catalog/products',
      query: params,
    });
  },
  publishProduct(id: string) {
    return apiRequest({
      method: 'POST',
      path: `/v1/admin/catalog/products/${encodeURIComponent(id)}/publish`,
    });
  },
  archiveProduct(id: string) {
    return apiRequest({
      method: 'POST',
      path: `/v1/admin/catalog/products/${encodeURIComponent(id)}/archive`,
    });
  },
  deleteProduct(id: string) {
    return apiRequest({
      method: 'DELETE',
      path: `/v1/admin/catalog/products/${encodeURIComponent(id)}`,
    });
  },
};

export const orderService = {
  list(params: { page?: number; pageSize?: number; status?: string } = {}) {
    return apiFetch(pageSchema(adminOrderSchema), {
      path: '/v1/checkout/orders',
      query: params,
    });
  },
  get(id: string) {
    return apiFetch(adminOrderSchema, {
      path: `/v1/checkout/orders/${encodeURIComponent(id)}`,
    });
  },
};

export const customerService = {
  list(params: { page?: number; pageSize?: number; q?: string } = {}) {
    return apiFetch(pageSchema(adminCustomerSchema), {
      path: '/v1/admin/customers',
      query: params,
    });
  },
  get(id: string) {
    return apiFetch(adminCustomerSchema, {
      path: `/v1/admin/customers/${encodeURIComponent(id)}`,
    });
  },
};

export const cmsService = {
  listPages(params: { page?: number; pageSize?: number; status?: string } = {}) {
    return apiFetch(pageSchema(cmsPageSchema), {
      path: '/v1/admin/cms/pages',
      query: params,
    });
  },
  publishPage(id: string) {
    return apiRequest({
      method: 'POST',
      path: `/v1/admin/cms/pages/${encodeURIComponent(id)}/publish`,
    });
  },
  archivePage(id: string) {
    return apiRequest({
      method: 'POST',
      path: `/v1/admin/cms/pages/${encodeURIComponent(id)}/archive`,
    });
  },
};

export const opsService = {
  listFlags() {
    return apiFetch(z.array(featureFlagSchema), { path: '/v1/admin/ops/feature-flags' });
  },
  setFlag(key: string, input: { enabled?: boolean; rollout?: number | null }) {
    return apiFetch(featureFlagSchema, {
      method: 'PATCH',
      path: `/v1/admin/ops/feature-flags/${encodeURIComponent(key)}`,
      body: input,
    });
  },
  queueHealth() {
    return apiFetch(queueHealthSchema, { path: '/v1/admin/ops/queues' });
  },
  cacheFlush(scope: string) {
    return apiRequest({
      method: 'POST',
      path: '/v1/admin/ops/cache/flush',
      body: { scope },
    });
  },
};

export const auditService = {
  list(params: { page?: number; pageSize?: number; entity?: string } = {}) {
    return apiFetch(pageSchema(auditEntrySchema), {
      path: '/v1/admin/audit',
      query: params,
    });
  },
};

export const inventoryService = {
  lowStock(params: { threshold?: number; pageSize?: number } = {}) {
    return apiFetch(pageSchema(lowStockRowSchema), {
      path: '/v1/admin/inventory/low-stock',
      query: params,
    });
  },
};
