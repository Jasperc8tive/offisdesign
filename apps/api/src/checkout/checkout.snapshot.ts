import { createHash } from 'node:crypto';

/**
 * Priced cart lines frozen on the checkout session at review time. The order
 * is built from this snapshot, never from the live cart, so what the customer
 * reviewed is exactly what they pay for and what the order contains.
 */
export interface CartSnapshotLine {
  variantId: string;
  quantity: number;
  unitAmount: number;
  currency: string;
  productName: string;
  variantName: string | null;
  sku: string;
}

export interface CartSnapshot {
  fingerprint: string;
  currency: string;
  coupon: string | null;
  lines: CartSnapshotLine[];
}

/** Minimal cart shape the fingerprint depends on. */
export interface FingerprintableCart {
  currency: string;
  appliedCoupon: string | null;
  items: { variantId: string; quantity: number; unitAmount: number }[];
}

export interface SnapshotVariant {
  id: string;
  sku: string;
  name: string | null;
  product: { name: string };
}

/**
 * Stable hash of everything that affects the price of a cart. Line order is
 * irrelevant; any change to a quantity, unit price, currency or coupon
 * produces a different fingerprint.
 */
export function cartFingerprint(cart: FingerprintableCart): string {
  const lines = cart.items
    .map((i) => `${i.variantId}:${i.quantity}:${i.unitAmount}`)
    .sort()
    .join('|');
  return createHash('sha256')
    .update(`${cart.currency}#${cart.appliedCoupon ?? ''}#${lines}`)
    .digest('hex');
}

export interface SnapshotCart extends FingerprintableCart {
  items: { variantId: string; quantity: number; unitAmount: number; currency: string }[];
}

export function buildSnapshot(cart: SnapshotCart, variants: SnapshotVariant[]): CartSnapshot {
  const byId = new Map(variants.map((v) => [v.id, v]));
  return {
    fingerprint: cartFingerprint(cart),
    currency: cart.currency,
    coupon: cart.appliedCoupon,
    lines: cart.items.map((i) => {
      const variant = byId.get(i.variantId);
      return {
        variantId: i.variantId,
        quantity: i.quantity,
        unitAmount: i.unitAmount,
        currency: i.currency,
        productName: variant?.product.name ?? 'Unknown product',
        variantName: variant?.name ?? null,
        sku: variant?.sku ?? 'UNKNOWN',
      };
    }),
  };
}

/** Narrow the session's `cartSnapshot` JSON column back to its type. */
export function readSnapshot(json: unknown): CartSnapshot | null {
  if (!json || typeof json !== 'object') return null;
  const s = json as Partial<CartSnapshot>;
  if (typeof s.fingerprint !== 'string' || !Array.isArray(s.lines)) return null;
  return s as CartSnapshot;
}
