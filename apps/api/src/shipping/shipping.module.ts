import { Global, Module } from '@nestjs/common';
import { FlatShippingService } from './flat-shipping.service';
import { SHIPPING_SERVICE } from './shipping.interface';

@Global()
@Module({
  providers: [FlatShippingService, { provide: SHIPPING_SERVICE, useExisting: FlatShippingService }],
  exports: [SHIPPING_SERVICE],
})
export class ShippingModule {}
