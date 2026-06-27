import { Injectable, Logger } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import type { EmailAdapter, EmailMessage } from './notifications.interface';

/**
 * Development email adapter — writes to the logger instead of sending. Real
 * SMTP / provider adapters drop in behind the same interface.
 */
@Injectable()
export class LogEmailAdapter implements EmailAdapter {
  readonly name = 'log';
  private readonly logger = new Logger(LogEmailAdapter.name);

  async send(message: EmailMessage): Promise<{ id: string }> {
    const id = uuidv7();
    this.logger.log(`[email:${id}] to=${message.to} subject="${message.subject}"\n${message.text}`);
    return { id };
  }
}
