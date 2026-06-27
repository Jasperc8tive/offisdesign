/**
 * Domain event registry. Add new event names + payload shapes here so they
 * remain typed end-to-end (publisher → listener → outbound webhook).
 */
export type DomainEventMap = {
  'product.created': { productId: string; slug: string };
  'product.updated': { productId: string; slug: string };
  'product.published': { productId: string; slug: string };
  'product.archived': { productId: string; slug: string };
  'product.deleted': { productId: string; slug: string };

  'collection.updated': { collectionId: string; slug: string };
  'category.updated': { categoryId: string; slug: string };

  'inventory.adjusted': {
    inventoryItemId: string;
    variantId: string;
    delta: number;
    reason: string;
  };
  'inventory.reserved': {
    inventoryItemId: string;
    variantId: string;
    contextType: string;
    contextId: string;
    quantity: number;
  };
  'inventory.released': {
    inventoryItemId: string;
    variantId: string;
    contextType: string;
    contextId: string;
    quantity: number;
  };
  'inventory.committed': {
    inventoryItemId: string;
    variantId: string;
    contextType: string;
    contextId: string;
    quantity: number;
  };

  'price.changed': {
    variantId: string;
    productId: string;
    oldAmount: number;
    newAmount: number;
    currency: string;
  };

  // Customer identity
  'customer.registered': { customerId: string; email: string };
  'customer.email-verified': { customerId: string; email: string };
  'customer.password-reset-requested': { email: string };
  'customer.deactivated': { customerId: string };

  // Cart
  'cart.created': { cartId: string; customerId?: string; anonymousId?: string };
  'cart.merged': { fromCartId: string; intoCartId: string; customerId: string };
  'cart.item-added': { cartId: string; variantId: string; quantity: number };
  'cart.item-removed': { cartId: string; variantId: string };
  'cart.cleared': { cartId: string };

  // Checkout & order
  'checkout.started': { checkoutId: string; cartId: string };
  'checkout.completed': { checkoutId: string; orderId: string };
  'checkout.expired': { checkoutId: string };
  'payment.succeeded': {
    orderId: string;
    provider: string;
    providerRef: string;
    amount: number;
    currency: string;
  };
  'payment.failed': { orderId: string; provider: string; providerRef: string; reason: string };
  'order.placed': { orderId: string; customerId?: string; total: number; currency: string };
  'order.cancelled': { orderId: string };
  'refund.created': {
    orderId: string;
    paymentId: string;
    amount: number;
    currency: string;
    reason?: string;
  };

  // Marketing
  'newsletter.subscribed': { subscriptionId: string; email: string; source?: string };
};

export type DomainEventName = keyof DomainEventMap;

export interface DomainEvent<N extends DomainEventName = DomainEventName> {
  name: N;
  aggregateType: string;
  aggregateId: string;
  payload: DomainEventMap[N];
  actorId?: string | undefined;
  occurredAt: Date;
}
