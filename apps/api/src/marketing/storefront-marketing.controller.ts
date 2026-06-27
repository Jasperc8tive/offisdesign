import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { MarketingService, subscribeSchema, type SubscribeInput } from './marketing.service';

const unsubscribeSchema = z.object({ email: z.string().email() });

@ApiTags('marketing (storefront)')
@Controller('v1/storefront/marketing')
export class StorefrontMarketingController {
  constructor(private readonly service: MarketingService) {}

  @Post('newsletter')
  subscribe(@Body(new ZodValidationPipe(subscribeSchema)) body: SubscribeInput) {
    return this.service.subscribe(body);
  }

  @Post('newsletter/unsubscribe')
  @HttpCode(204)
  async unsubscribe(
    @Body(new ZodValidationPipe(unsubscribeSchema)) body: z.infer<typeof unsubscribeSchema>,
  ) {
    await this.service.unsubscribe(body.email);
  }
}
