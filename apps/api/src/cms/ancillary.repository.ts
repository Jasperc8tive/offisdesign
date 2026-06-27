import { Injectable } from '@nestjs/common';
import { type Prisma } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AncillaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Navigation ────────────────────────────────────────────────────────

  listNavigation() {
    return this.prisma.navigation.findMany({ orderBy: { key: 'asc' } });
  }

  findNavigation(key: string) {
    return this.prisma.navigation.findUnique({ where: { key } });
  }

  upsertNavigation(input: { id: string; key: string; name: string; items: Prisma.InputJsonValue }) {
    return this.prisma.navigation.upsert({
      where: { key: input.key },
      update: { name: input.name, items: input.items },
      create: input,
    });
  }

  deleteNavigation(key: string) {
    return this.prisma.navigation.delete({ where: { key } });
  }

  // ── Announcements ─────────────────────────────────────────────────────

  listAnnouncements(now = new Date()) {
    return this.prisma.announcement.findMany({
      where: {
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAllAnnouncements() {
    return this.prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
  }

  createAnnouncement(data: Prisma.AnnouncementCreateInput) {
    return this.prisma.announcement.create({ data });
  }

  updateAnnouncement(id: string, data: Prisma.AnnouncementUpdateInput) {
    return this.prisma.announcement.update({ where: { id }, data });
  }

  deleteAnnouncement(id: string) {
    return this.prisma.announcement.delete({ where: { id } });
  }

  // ── Testimonials ──────────────────────────────────────────────────────

  listTestimonials(visibleOnly = true) {
    return this.prisma.testimonial.findMany({
      where: visibleOnly ? { isVisible: true } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  createTestimonial(data: Prisma.TestimonialCreateInput) {
    return this.prisma.testimonial.create({ data });
  }

  updateTestimonial(id: string, data: Prisma.TestimonialUpdateInput) {
    return this.prisma.testimonial.update({ where: { id }, data });
  }

  deleteTestimonial(id: string) {
    return this.prisma.testimonial.delete({ where: { id } });
  }

  // ── FAQs ──────────────────────────────────────────────────────────────

  listFaqs(visibleOnly = true) {
    return this.prisma.faq.findMany({
      where: visibleOnly ? { isVisible: true } : {},
      orderBy: [{ category: 'asc' }, { position: 'asc' }],
    });
  }

  createFaq(data: Prisma.FaqCreateInput) {
    return this.prisma.faq.create({ data });
  }

  updateFaq(id: string, data: Prisma.FaqUpdateInput) {
    return this.prisma.faq.update({ where: { id }, data });
  }

  deleteFaq(id: string) {
    return this.prisma.faq.delete({ where: { id } });
  }
}
