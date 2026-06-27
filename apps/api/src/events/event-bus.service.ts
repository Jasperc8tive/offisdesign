import { Injectable, Logger } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import { PrismaService } from '../prisma/prisma.service';
import type { DomainEvent, DomainEventMap, DomainEventName } from './domain-event';

type Handler<N extends DomainEventName> = (event: DomainEvent<N>) => void | Promise<void>;

/**
 * In-process pub-sub backed by a persisted `domain_event` row. Listeners are
 * dispatched after the event row is committed. Failures are logged but do not
 * roll back the source transaction — feature stages add reliable handlers via
 * the queue infrastructure.
 */
@Injectable()
export class EventBus {
  private readonly logger = new Logger(EventBus.name);
  private readonly handlers = new Map<DomainEventName, Set<Handler<DomainEventName>>>();

  constructor(private readonly prisma: PrismaService) {}

  on<N extends DomainEventName>(name: N, handler: Handler<N>): void {
    const set = this.handlers.get(name) ?? new Set<Handler<DomainEventName>>();
    set.add(handler as Handler<DomainEventName>);
    this.handlers.set(name, set);
  }

  async publish<N extends DomainEventName>(
    name: N,
    aggregateType: string,
    aggregateId: string,
    payload: DomainEventMap[N],
    actorId?: string,
  ): Promise<void> {
    await this.prisma.domainEvent.create({
      data: {
        id: uuidv7(),
        type: name,
        aggregateType,
        aggregateId,
        payload: payload as object,
      },
    });
    const event: DomainEvent<N> = {
      name,
      aggregateType,
      aggregateId,
      payload,
      ...(actorId !== undefined ? { actorId } : {}),
      occurredAt: new Date(),
    };
    const handlers = this.handlers.get(name);
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        await (handler as Handler<N>)(event);
      } catch (err) {
        this.logger.error(
          `Handler for ${name} failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}
