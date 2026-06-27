import { Global, Module } from '@nestjs/common';
import { FlatTaxService } from './flat-tax.service';
import { TAX_SERVICE } from './tax.interface';

@Global()
@Module({
  providers: [FlatTaxService, { provide: TAX_SERVICE, useExisting: FlatTaxService }],
  exports: [TAX_SERVICE],
})
export class TaxModule {}
