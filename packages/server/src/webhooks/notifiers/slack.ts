import axios from 'axios';
import { SlackNotificationConfig } from '../types';

export class SlackNotifier {
  async send(config: SlackNotificationConfig, message: any): Promise<boolean> {
    try {
      const payload = {
        channel: config.channel,
        username: config.username || 'VereinsKalender',
        icon_emoji: config.iconEmoji || ':calendar:',
        ...message,
      };

      await axios.post(config.webhookUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      console.log('Slack notification sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      return false;
    }
  }

  /**
   * Format a rich Slack message from calendar data
   */
  formatEventMessage(title: string, description: string, date: string): any {
    return {
      text: `New calendar event: ${title}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'New Calendar Event',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Title*\n${title}`,
            },
            {
              type: 'mrkdwn',
              text: `*Date*\n${date}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Description*\n${description || 'No description'}`,
          },
        },
      ],
    };
  }

  formatConflictMessage(
    eventTitle: string,
    conflictReason: string,
    severity: string
  ): any {
    return {
      text: `Scheduling conflict: ${eventTitle}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Scheduling Conflict Detected',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Event*\n${eventTitle}`,
            },
            {
              type: 'mrkdwn',
              text: `*Severity*\n${severity.toUpperCase()}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Reason*\n${conflictReason}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Review Conflict',
              },
              url: process.env.APP_URL || 'https://vereinskalender.local',
              style: 'danger',
            },
          ],
        },
      ],
    };
  }
}
