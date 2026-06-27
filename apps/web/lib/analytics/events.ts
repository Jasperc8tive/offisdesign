/**
 * Typed analytics event registry. Adding a new event means adding a new
 * entry here; the call site is then type-checked end-to-end.
 */
export type AnalyticsEventMap = {
  page_view: { path: string; title?: string };
  cta_click: { id: string; location: string; href?: string };
  newsletter_subscribed: { source: string };
  newsletter_subscribe_failed: { source: string; code: string };
  product_click: { productId: string; slug: string; location: string };
  collection_click: { collectionId: string; slug: string; location: string };
  search_submitted: { q: string };
  search_filter_changed: { facet: string; value: string };
  search_paginated: { page: number };
  nav_clicked: { label: string; href: string; surface: 'header' | 'mobile' | 'footer' };
  cart_opened: { trigger: 'header' | 'auto' };
  cart_item_added: { variantId: string; productSlug?: string };
  checkout_step_viewed: { step: 'address' | 'shipping' | 'payment' | 'review' };
  purchase: { orderId: string; value: number; currency: string };
  purchase_confirmed: { orderId: string };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;
