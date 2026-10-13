import { z } from 'zod';
import { addressSchema } from '../../customer/dto/customer.dto';

export const startCheckoutSchema = z.object({
  email: z.string().email(),
});
export type StartCheckoutInput = z.infer<typeof startCheckoutSchema>;

export const setAddressSchema = addressSchema;
export type SetAddressInput = z.infer<typeof setAddressSchema>;

/**
 * The client only names a quoted rate; carrier, service and amount are
 * resolved server-side from `ShippingService.rates()` so they can't be forged.
 */
export const setShippingMethodSchema = z.object({
  rateId: z.string().min(1),
});
export type SetShippingMethodInput = z.infer<typeof setShippingMethodSchema>;

export const placeOrderSchema = z.object({
  /**
   * Optional client confirmation that the payment intent has been confirmed
   * client-side (3DS flow). Server still re-verifies via the provider.
   */
  paymentIntentRef: z.string().optional(),
});
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
