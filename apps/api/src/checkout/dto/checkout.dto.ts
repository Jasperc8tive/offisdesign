import { z } from 'zod';
import { addressSchema } from '../../customer/dto/customer.dto';

export const startCheckoutSchema = z.object({
  email: z.string().email(),
});
export type StartCheckoutInput = z.infer<typeof startCheckoutSchema>;

export const setAddressSchema = addressSchema;
export type SetAddressInput = z.infer<typeof setAddressSchema>;

export const setShippingMethodSchema = z.object({
  rateId: z.string().min(1),
  amount: z.number().int().min(0),
  carrier: z.string().min(1),
  service: z.string().min(1),
  estimatedDaysMin: z.number().int().min(0),
  estimatedDaysMax: z.number().int().min(0),
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
