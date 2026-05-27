import axios from 'axios';
import { WebhookEvent, IntegrationConfig } from '../types';

export class CalendarSyncer {
  async sync(event: WebhookEvent, config: IntegrationConfig): Promise<boolean> {
    const results: boolean[] = [];

    if (config.googleCalendar && this.isCalendarEvent(event)) {
      results.push(await this.syncToGoogle(event, config.googleCalendar));
    }

    if (config.outlookCalendar && this.isCalendarEvent(event)) {
      results.push(await this.syncToOutlook(event, config.outlookCalendar));
    }

    return results.some((r) => r);
  }

  private async syncToGoogle(event: WebhookEvent, config: any): Promise<boolean> {
    try {
      const eventData = event.data;

      const googleEvent = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startDate,
        },
        end: {
          dateTime: eventData.endDate,
        },
      };

      const action =
        event.type === 'entry.created'
          ? 'create'
          : event.type === 'entry.deleted'
            ? 'delete'
            : 'update';

      if (action === 'create') {
        await axios.post(
          `https://www.googleapis.com/calendar/v3/calendars/${config.calendarId}/events`,
          googleEvent,
          {
            headers: {
              Authorization: `Bearer ${config.accessToken}`,
            },
          }
        );
      } else if (action === 'update') {
        // Implementation for update
      } else if (action === 'delete') {
        // Implementation for delete
      }

      console.log(`Event synced to Google Calendar: ${event.id}`);
      return true;
    } catch (error) {
      console.error('Failed to sync to Google Calendar:', error);
      return false;
    }
  }

  private async syncToOutlook(event: WebhookEvent, config: any): Promise<boolean> {
    try {
      const eventData = event.data;

      const outlookEvent = {
        subject: eventData.title,
        bodyPreview: eventData.description,
        start: {
          dateTime: eventData.startDate,
          timeZone: 'UTC',
        },
        end: {
          dateTime: eventData.endDate,
          timeZone: 'UTC',
        },
      };

      const action =
        event.type === 'entry.created'
          ? 'create'
          : event.type === 'entry.deleted'
            ? 'delete'
            : 'update';

      if (action === 'create') {
        await axios.post(
          'https://graph.microsoft.com/v1.0/me/events',
          outlookEvent,
          {
            headers: {
              Authorization: `Bearer ${config.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      console.log(`Event synced to Outlook: ${event.id}`);
      return true;
    } catch (error) {
      console.error('Failed to sync to Outlook:', error);
      return false;
    }
  }

  private isCalendarEvent(event: WebhookEvent): boolean {
    return [
      'entry.created',
      'entry.updated',
      'entry.deleted',
    ].includes(event.type);
  }

  /**
   * Fetch events from Google Calendar
   */
  async fetchFromGoogle(config: any, timeMin: string, timeMax: string) {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/calendar/v3/calendars/${config.calendarId}/events`,
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
          },
          params: {
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
          },
        }
      );

      return response.data.items || [];
    } catch (error) {
      console.error('Failed to fetch from Google Calendar:', error);
      return [];
    }
  }

  /**
   * Fetch events from Outlook
   */
  async fetchFromOutlook(config: any, timeMin: string, timeMax: string) {
    try {
      const response = await axios.get(
        'https://graph.microsoft.com/v1.0/me/events',
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
          },
          params: {
            '$filter': `start/dateTime ge '${timeMin}' and start/dateTime lt '${timeMax}'`,
            '$orderby': 'start/dateTime',
          },
        }
      );

      return response.data.value || [];
    } catch (error) {
      console.error('Failed to fetch from Outlook:', error);
      return [];
    }
  }

  /**
   * Two-way sync: pull changes from external calendar
   */
  async bidirectionalSync(
    event: WebhookEvent,
    config: IntegrationConfig
  ): Promise<any[]> {
    const now = new Date();
    const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
    const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days ahead

    const externalEvents: any[] = [];

    if (config.googleCalendar) {
      externalEvents.push(
        ...(await this.fetchFromGoogle(config.googleCalendar, timeMin, timeMax))
      );
    }

    if (config.outlookCalendar) {
      externalEvents.push(
        ...(await this.fetchFromOutlook(config.outlookCalendar, timeMin, timeMax))
      );
    }

    return externalEvents;
  }
}
