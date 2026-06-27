import { Module } from '@nestjs/common';
import { LoggerModule as PinoModule } from 'nestjs-pino';
import { getContext } from '../common/request-context';

const isDev = process.env.NODE_ENV === 'development';

@Module({
  imports: [
    PinoModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        autoLogging: true,
        customProps: () => {
          const ctx = getContext();
          return ctx?.requestId ? { requestId: ctx.requestId } : {};
        },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
            '*.passwordHash',
            '*.password',
          ],
          censor: '[redacted]',
        },
        ...(isDev
          ? {
              transport: {
                target: 'pino-pretty',
                options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' },
              },
            }
          : {}),
      },
    }),
  ],
})
export class LoggerModule {}
