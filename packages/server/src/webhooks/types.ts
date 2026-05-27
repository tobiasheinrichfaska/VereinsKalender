import { UUID, CalendarEntry, Group } from '@vereinskalender/shared';

export type WebhookEventType =
  | 'entry.created'
  | 'entry.updated'
  | 'entry.deleted'
  | 'group.created'
  | 'group.updated'
  | 'group.deleted'
  | 'conflict.detected'
  | 'conflict.resolved'
  | 'reminder.due'
  | 'export.requested';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  timestamp: number;
  userId?: string;
  data: any;
  version: number;
}

export interface WebhookEndpoint {
  id: string;
  event: WebhookEventType;
  url: string;
  active: boolean;
  headers?: Record<string, string>;
  retryPolicy: RetryPolicy;
  createdAt: number;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempts: number;
  lastAttemptAt?: number;
  nextRetryAt?: number;
  error?: string;
}

export interface SlackNotificationConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export interface EmailNotificationConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromAddress: string;
}

export interface CalendarSyncConfig {
  provider: 'google' | 'outlook' | 'ical';
  accessToken?: string;
  refreshToken?: string;
  calendarId?: string;
  iCalUrl?: string;
}

export interface IntegrationConfig {
  slack?: SlackNotificationConfig;
  email?: EmailNotificationConfig;
  googleCalendar?: CalendarSyncConfig;
  outlookCalendar?: CalendarSyncConfig;
}
