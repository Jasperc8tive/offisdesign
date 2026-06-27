import { Inject, Injectable } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import type { ApiEnv } from '@offisdesign/config';
import { API_ENV } from '../config/config.module';
import type {
  CreateShipmentInput,
  Shipment,
  ShippingRate,
  ShippingRateRequest,
  ShippingService,
} from './shipping.interface';

/**
 * Mock shipping driver:
 * - Standard service: `SHIPPING_FLAT_AMOUNT` (free above £500 subtotal).
 * - Express service: standard + £15.00.
 *
 * `createShipment` returns a fake tracking number. Real carriers
 * (Royal Mail, DPD, Stripe-Shipping…) implement the same interface.
 */
@Injectable()
export class FlatShippingService implements ShippingService {
  readonly name = 'flat';

  constructor(@Inject(API_ENV) private readonly env: ApiEnv) {}

  async rates(req: ShippingRateRequest): Promise<ShippingRate[]> {
    const base = req.subtotal >= 50_000 ? 0 : this.env.SHIPPING_FLAT_AMOUNT;
    return [
      {
        id: 'standard',
        carrier: 'Internal',
        service: 'Standard',
        amount: base,
        currency: req.currency,
        estimatedDaysMin: 3,
        estimatedDaysMax: 5,
      },
      {
        id: 'express',
        carrier: 'Internal',
        service: 'Express',
        amount: base + 1500,
        currency: req.currency,
        estimatedDaysMin: 1,
        estimatedDaysMax: 2,
      },
    ];
  }

  async createShipment(input: CreateShipmentInput): Promise<Shipment> {
    return {
      id: uuidv7(),
      carrier: 'Internal',
      trackingNumber: `MOCK-${input.orderId.slice(0, 8).toUpperCase()}`,
      status: 'CREATED',
    };
  }
}
