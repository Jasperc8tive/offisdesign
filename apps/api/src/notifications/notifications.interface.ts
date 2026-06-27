export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailAdapter {
  readonly name: string;
  send(message: EmailMessage): Promise<{ id: string }>;
}

export const EMAIL_ADAPTER = Symbol('EMAIL_ADAPTER');

export interface SmsMessage {
  to: string;
  body: string;
}
export interface SmsAdapter {
  readonly name: string;
  send(message: SmsMessage): Promise<{ id: string }>;
}
export const SMS_ADAPTER = Symbol('SMS_ADAPTER');

export interface PushMessage {
  to: string;
  title: string;
  body: string;
}
export interface PushAdapter {
  readonly name: string;
  send(message: PushMessage): Promise<{ id: string }>;
}
export const PUSH_ADAPTER = Symbol('PUSH_ADAPTER');
