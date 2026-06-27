import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { SearchModule } from '../search/search.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CheckoutModule } from '../checkout/checkout.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { MediaModule } from '../media/media.module';
import { CmsModule } from '../cms/cms.module';

@Module({
  imports: [SearchModule, InventoryModule, CheckoutModule, WebhooksModule, MediaModule, CmsModule],
  providers: [JobsService],
})
export class JobsModule {}
