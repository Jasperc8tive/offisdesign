import { Injectable, NotFoundException } from '@nestjs/common';
import { type Prisma } from '@offisdesign/database';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';

export const settingUpsertSchema = z.object({
  key: z.string().min(1).max(120),
  value: z.unknown(),
  isPublic: z.boolean().default(false),
});
export type SettingUpsertInput = z.infer<typeof settingUpsertSchema>;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
  }

  listPublic() {
    return this.prisma.systemSetting.findMany({
      where: { isPublic: true },
      orderBy: { key: 'asc' },
    });
  }

  async get(key: string) {
    const row = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (!row) throw new NotFoundException();
    return row;
  }

  upsert(input: SettingUpsertInput, actorId?: string) {
    return this.prisma.systemSetting.upsert({
      where: { key: input.key },
      update: {
        value: input.value as Prisma.InputJsonValue,
        isPublic: input.isPublic,
        ...(actorId ? { updatedBy: actorId } : {}),
      },
      create: {
        key: input.key,
        value: input.value as Prisma.InputJsonValue,
        isPublic: input.isPublic,
        ...(actorId ? { updatedBy: actorId } : {}),
      },
    });
  }

  delete(key: string) {
    return this.prisma.systemSetting.delete({ where: { key } });
  }
}
