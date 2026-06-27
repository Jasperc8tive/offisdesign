export interface ShippingAddressSnapshot {
  countryCode: string;
  region?: string;
  postcode: string;
}

export interface ShippableLine {
  variantId: string;
  weightGrams: number | null;
  quantity: number;
}

export interface ShippingRateRequest {
  currency: string;
  subtotal: number;
  destination: ShippingAddressSnapshot;
  lines: ShippableLine[];
}

export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  amount: number;
  currency: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export interface CreateShipmentInput {
  orderId: string;
  rateId: string;
  to: ShippingAddressSnapshot;
}

export interface Shipment {
  id: string;
  carrier: string;
  trackingNumber: string | null;
  status: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
}

export interface ShippingService {
  readonly name: string;
  rates(req: ShippingRateRequest): Promise<ShippingRate[]>;
  createShipment(input: CreateShipmentInput): Promise<Shipment>;
}

export const SHIPPING_SERVICE = Symbol('SHIPPING_SERVICE');
