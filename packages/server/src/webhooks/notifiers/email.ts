import nodemailer from 'nodemailer';
import { EmailNotificationConfig } from '../types';

export class EmailNotifier {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {}

  async initialize(config: EmailNotificationConfig): Promise<boolean> {
    try {
      this.transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPassword,
        },
      });

      // Test connection
      await this.transporter.verify();
      console.log('Email notifier initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize email notifier:', error);
      return false;
    }
  }

  async send(
    config: EmailNotificationConfig,
    emailData: {
      subject: string;
      body: string;
      recipients: string[];
    }
  ): Promise<boolean> {
    if (!this.transporter) {
      const initialized = await this.initialize(config);
      if (!initialized) {
        return false;
      }
    }

    try {
      await this.transporter!.sendMail({
        from: config.fromAddress,
        to: emailData.recipients.join(','),
        subject: emailData.subject,
        html: emailData.body,
      });

      console.log(`Email sent to ${emailData.recipients.length} recipients`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  formatReminderEmail(
    eventTitle: string,
    eventDate: string,
    eventDescription?: string
  ): string {
    const date = new Date(eventDate).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .footer { margin-top: 20px; font-size: 12px; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Erinnerung: ${eventTitle}</h2>
            </div>
            <div class="content">
              <p>Hallo,</p>
              <p>dies ist eine Erinnerung für den folgenden Termin:</p>
              <ul>
                <li><strong>Titel:</strong> ${eventTitle}</li>
                <li><strong>Datum:</strong> ${date}</li>
                ${eventDescription ? `<li><strong>Beschreibung:</strong> ${eventDescription}</li>` : ''}
              </ul>
              <p>Bitte beachte diesen Termin in deinem Kalender.</p>
              <p>Mit freundlichen Grüßen,<br/>VereinsKalender</p>
            </div>
            <div class="footer">
              <p>Diese E-Mail wurde automatisch von VereinsKalender generiert.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  formatEventCreatedEmail(title: string, date: string, description?: string): string {
    const dateStr = new Date(date).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Neuer Termin erstellt: ${title}</h2>
            </div>
            <div class="content">
              <p>Ein neuer Termin wurde zum Kalender hinzugefügt:</p>
              <ul>
                <li><strong>Titel:</strong> ${title}</li>
                <li><strong>Datum:</strong> ${dateStr}</li>
                ${description ? `<li><strong>Beschreibung:</strong> ${description}</li>` : ''}
              </ul>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  formatConflictEmail(
    eventTitle: string,
    conflictReason: string,
    severity: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f44336; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .severity {
              padding: 10px;
              border-radius: 3px;
              background-color: ${severity === 'hard' ? '#ffebee' : '#fff3e0'};
              color: ${severity === 'hard' ? '#c62828' : '#e65100'};
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Terminkonflikt erkannt</h2>
            </div>
            <div class="content">
              <p><strong>Ereignis:</strong> ${eventTitle}</p>
              <div class="severity">
                <strong>Schweregrad:</strong> ${severity === 'hard' ? 'Kritisch' : 'Warnung'}
              </div>
              <p><strong>Grund:</strong> ${conflictReason}</p>
              <p>Bitte überprüfen Sie den Kalender und lösen Sie diesen Konflikt.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
