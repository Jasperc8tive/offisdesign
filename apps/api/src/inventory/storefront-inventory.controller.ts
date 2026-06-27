import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { PrismaService } from '../prisma/prisma.service';

const availabilitySchema = z.object({
  variantIds: z.array(z.string().uuid()).min(1).max(100),
});

@ApiTags('inventory (storefront)')
@Controller('v1/storefront/inventory')
export class StorefrontInventoryController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregated availability across all warehouses for each requested
   * variant. Returns `available = onHand - reserved` summed across rows,
   * plus a simple state classification the storefront UI can render.
   */
  @Post('availability')
  async availability(
    @Body(new ZodValidationPipe(availabilitySchema))
    body: z.infer<typeof availabilitySchema>,
  ) {
    const rows = await this.prisma.inventoryItem.groupBy({
      by: ['variantId'],
      where: { variantId: { in: body.variantIds } },
      _sum: { onHand: true, reserved: true },
    });
    const byVariant = new Map<string, { onHand: number; reserved: number }>();
    for (const row of rows) {
      byVariant.set(row.variantId, {
        onHand: row._sum.onHand ?? 0,
        reserved: row._sum.reserved ?? 0,
      });
    }
    return body.variantIds.map((variantId) => {
      const aggregate = byVariant.get(variantId);
      const onHand = aggregate?.onHand ?? 0;
      const reserved = aggregate?.reserved ?? 0;
      const available = Math.max(0, onHand - reserved);
      return { variantId, available, state: classifyAvailability(available) };
    });
  }
}

export type AvailabilityState = 'in_stock' | 'low_stock' | 'out_of_stock';

/** Pure classifier: 0 → out, 1..5 → low, else in stock. Exported for tests. */
export function classifyAvailability(available: number): AvailabilityState {
  if (available <= 0) return 'out_of_stock';
  if (available <= 5) return 'low_stock';
  return 'in_stock';
}
