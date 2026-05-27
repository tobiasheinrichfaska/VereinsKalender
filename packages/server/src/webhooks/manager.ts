import axios, { AxiosError } from 'axios';
import {
  WebhookEventType,
  WebhookEvent,
  WebhookEndpoint,
  RetryPolicy,
  WebhookDelivery,
  IntegrationConfig,
} from './types';
import { SlackNotifier } from './notifiers/slack';
import { EmailNotifier } from './notifiers/email';
import { CalendarSyncer } from './integrations/calendar-syncer';
import { generateUUID } from '@vereinskalender/shared';

export class WebhookManager {
  private webhooks: Map<string, WebhookEndpoint> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private eventQueue: WebhookEvent[] = [];
  private processingQueue = false;
  private defaultRetryPolicy: RetryPolicy = {
    maxRetries: 5,
    initialDelayMs: 1000,
    maxDelayMs: 60000,
    backoffMultiplier: 2,
  };

  private slackNotifier: SlackNotifier;
  private emailNotifier: EmailNotifier;
  private calendarSyncer: CalendarSyncer;
  private integrationConfig: IntegrationConfig = {};

  constructor() {
    this.slackNotifier = new SlackNotifier();
    this.emailNotifier = new EmailNotifier();
    this.calendarSyncer = new CalendarSyncer();

    // Process webhook queue periodically
    setInterval(() => this.processQueue(), 5000);
  }

  /**
   * Register a webhook endpoint
   */
  register(
    event: WebhookEventType,
    url: string,
    retryPolicy?: Partial<RetryPolicy>,
    headers?: Record<string, string>
  ): string {
    const webhookId = generateUUID();
    const endpoint: WebhookEndpoint = {
      id: webhookId,
      event,
      url,
      active: true,
      headers,
      retryPolicy: { ...this.defaultRetryPolicy, ...retryPolicy },
      createdAt: Date.now(),
    };

    this.webhooks.set(webhookId, endpoint);
    console.log(`Registered webhook: ${webhookId} for event ${event}`);

    return webhookId;
  }

  /**
   * Unregister a webhook
   */
  unregister(webhookId: string): boolean {
    const removed = this.webhooks.delete(webhookId);
    if (removed) {
      console.log(`Unregistered webhook: ${webhookId}`);
    }
    return removed;
  }

  /**
   * Emit an event that triggers registered webhooks
   */
  emit(eventType: WebhookEventType, data: any, userId?: string): string {
    const eventId = generateUUID();
    const event: WebhookEvent = {
      id: eventId,
      type: eventType,
      timestamp: Date.now(),
      userId,
      data,
      version: 1,
    };

    this.eventQueue.push(event);
    this.processQueue();

    // Handle third-party integrations
    this.handleIntegrations(event);

    return eventId;
  }

  /**
   * Set integration configuration
   */
  configureIntegration(config: Partial<IntegrationConfig>) {
    this.integrationConfig = { ...this.integrationConfig, ...config };
    console.log('Updated integration configuration');
  }

  /**
   * Get integration status
   */
  getIntegrationStatus() {
    return {
      slack: !!this.integrationConfig.slack,
      email: !!this.integrationConfig.email,
      googleCalendar: !!this.integrationConfig.googleCalendar,
      outlookCalendar: !!this.integrationConfig.outlookCalendar,
    };
  }

  /**
   * Process pending webhook deliveries
   */
  private async processQueue() {
    if (this.processingQueue || this.eventQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.deliverEvent(event);
      }
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Deliver an event to all registered webhooks
   */
  private async deliverEvent(event: WebhookEvent) {
    const matchingWebhooks = Array.from(this.webhooks.values()).filter(
      (w) => w.event === event.type && w.active
    );

    for (const webhook of matchingWebhooks) {
      const deliveryId = generateUUID();
      const delivery: WebhookDelivery = {
        id: deliveryId,
        webhookId: webhook.id,
        eventId: event.id,
        status: 'pending',
        attempts: 0,
      };

      this.deliveries.set(deliveryId, delivery);
      await this.attemptDelivery(webhook, event, delivery);
    }
  }

  /**
   * Attempt to deliver webhook with retry logic
   */
  private async attemptDelivery(
    webhook: WebhookEndpoint,
    event: WebhookEvent,
    delivery: WebhookDelivery
  ) {
    const maxRetries = webhook.retryPolicy.maxRetries;

    while (delivery.attempts < maxRetries) {
      try {
        delivery.attempts++;
        delivery.lastAttemptAt = Date.now();

        const response = await axios.post(webhook.url, event, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': this.generateSignature(event),
            ...webhook.headers,
          },
          timeout: 30000,
        });

        if (response.status >= 200 && response.status < 300) {
          delivery.status = 'success';
          console.log(`Webhook delivered successfully: ${delivery.id}`);
          return;
        }
      } catch (error) {
        const axiosError = error as AxiosError;
        delivery.error = axiosError.message;

        if (delivery.attempts < maxRetries) {
          const delay = this.calculateBackoffDelay(
            delivery.attempts,
            webhook.retryPolicy
          );
          delivery.nextRetryAt = Date.now() + delay;
          delivery.status = 'retrying';

          console.log(
            `Webhook retry ${delivery.attempts}/${maxRetries} scheduled for ${webhook.url}`
          );

          await this.delay(delay);
        }
      }
    }

    delivery.status = 'failed';
    console.error(
      `Webhook delivery failed after ${maxRetries} attempts: ${webhook.url}`
    );
  }

  /**
   * Handle third-party integrations
   */
  private async handleIntegrations(event: WebhookEvent) {
    // Slack notifications
    if (this.integrationConfig.slack) {
      const message = this.formatSlackMessage(event);
      if (message) {
        await this.slackNotifier.send(this.integrationConfig.slack, message);
      }
    }

    // Email notifications
    if (this.integrationConfig.email && this.shouldSendEmail(event)) {
      const emailData = this.formatEmailData(event);
      if (emailData) {
        await this.emailNotifier.send(this.integrationConfig.email, emailData);
      }
    }

    // Calendar sync
    if (
      (this.integrationConfig.googleCalendar ||
        this.integrationConfig.outlookCalendar) &&
      this.isCalendarEvent(event)
    ) {
      await this.calendarSyncer.sync(event, this.integrationConfig);
    }
  }

  private formatSlackMessage(event: WebhookEvent): any | null {
    const timestamp = new Date(event.timestamp).toLocaleString('de-DE');

    switch (event.type) {
      case 'entry.created':
        return {
          text: `📅 New event created: ${event.data.title}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*New Event Created*\n*Title:* ${event.data.title}\n*Date:* ${event.data.startDate}\n*Time:* ${timestamp}`,
              },
            },
          ],
        };

      case 'entry.updated':
        return {
          text: `✏️ Event updated: ${event.data.title}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Event Updated*\n*Title:* ${event.data.title}\n*Modified:* ${timestamp}`,
              },
            },
          ],
        };

      case 'conflict.detected':
        return {
          text: `⚠️ Schedule conflict detected`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Conflict Alert*\n*Severity:* ${event.data.severity}\n*Reason:* ${event.data.reason || 'Unknown conflict'}\n*Time:* ${timestamp}`,
              },
            },
          ],
        };

      case 'reminder.due':
        return {
          text: `🔔 Reminder: ${event.data.eventTitle}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Reminder Due*\n*Event:* ${event.data.eventTitle}\n*Time:* ${timestamp}`,
              },
            },
          ],
        };

      default:
        return null;
    }
  }

  private formatEmailData(event: WebhookEvent) {
    const timestamp = new Date(event.timestamp).toLocaleString('de-DE');

    switch (event.type) {
      case 'reminder.due':
        return {
          subject: `Reminder: ${event.data.eventTitle}`,
          body: `
            <h2>Event Reminder</h2>
            <p><strong>Event:</strong> ${event.data.eventTitle}</p>
            <p><strong>Date:</strong> ${event.data.eventDate}</p>
            <p><strong>Reminder Time:</strong> ${timestamp}</p>
          `,
          recipients: event.data.recipients || [],
        };

      case 'entry.created':
        return {
          subject: `New Event: ${event.data.title}`,
          body: `
            <h2>New Event Created</h2>
            <p><strong>Title:</strong> ${event.data.title}</p>
            <p><strong>Date:</strong> ${event.data.startDate}</p>
            <p><strong>Description:</strong> ${event.data.description || 'N/A'}</p>
          `,
          recipients: event.data.recipients || [],
        };

      default:
        return null;
    }
  }

  private shouldSendEmail(event: WebhookEvent): boolean {
    return ['reminder.due', 'entry.created', 'conflict.detected'].includes(
      event.type
    );
  }

  private isCalendarEvent(event: WebhookEvent): boolean {
    return [
      'entry.created',
      'entry.updated',
      'entry.deleted',
    ].includes(event.type);
  }

  private generateSignature(event: WebhookEvent): string {
    // In production, use HMAC-SHA256 with a secret key
    const crypto = require('crypto');
    const data = JSON.stringify(event);
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private calculateBackoffDelay(attempt: number, policy: RetryPolicy): number {
    const exponentialDelay = Math.min(
      policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt - 1),
      policy.maxDelayMs
    );
    // Add jitter
    return exponentialDelay * (0.5 + Math.random() * 0.5);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getDeliveryStatus(deliveryId: string) {
    return this.deliveries.get(deliveryId);
  }

  getWebhooks() {
    return Array.from(this.webhooks.values());
  }
}
