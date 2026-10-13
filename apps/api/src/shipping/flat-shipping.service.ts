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
 * Flat shipping driver (amounts in kobo, all env-configured):
 * - Standard: `SHIPPING_FLAT_AMOUNT`, free at or above `SHIPPING_FREE_THRESHOLD`
 *   (unset = never free).
 * - Express: standard + `SHIPPING_EXPRESS_SURCHARGE`; only offered when the
 *   surcharge is set (> 0).
 *
 * `createShipment` returns a fake tracking number. Real carriers implement the
 * same interface.
 */
@Injectable()
export class FlatShippingService implements ShippingService {
  readonly name = 'flat';

  constructor(@Inject(API_ENV) private readonly env: ApiEnv) {}

  async rates(req: ShippingRateRequest): Promise<ShippingRate[]> {
    const threshold = this.env.SHIPPING_FREE_THRESHOLD;
    const base =
      threshold !== undefined && req.subtotal >= threshold ? 0 : this.env.SHIPPING_FLAT_AMOUNT;
    const rates: ShippingRate[] = [
      {
        id: 'standard',
        carrier: 'Internal',
        service: 'Standard',
        amount: base,
        currency: req.currency,
        estimatedDaysMin: 3,
        estimatedDaysMax: 5,
      },
    ];
    if (this.env.SHIPPING_EXPRESS_SURCHARGE > 0) {
      rates.push({
        id: 'express',
        carrier: 'Internal',
        service: 'Express',
        amount: base + this.env.SHIPPING_EXPRESS_SURCHARGE,
        currency: req.currency,
        estimatedDaysMin: 1,
        estimatedDaysMax: 2,
      });
    }
    return rates;
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
