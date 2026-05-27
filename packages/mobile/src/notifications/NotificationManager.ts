import * as Notifications from 'expo-notifications';

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  trigger?: Notifications.NotificationTriggerInput;
}

export class NotificationManager {
  private token: string | null = null;

  async initialize(): Promise<void> {
    try {
      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();

      if (status !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      // Get push notification token
      this.token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', this.token);

      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          };
        },
      });

      // Listen for notifications
      this.setupNotificationListeners();

      console.log('NotificationManager initialized');
    } catch (error) {
      console.error('Failed to initialize NotificationManager:', error);
    }
  }

  /**
   * Send a local notification
   */
  async sendLocalNotification(data: PushNotificationData): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: data.data || {},
        },
        trigger: data.trigger || { seconds: 1 },
      });

      console.log('Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Failed to send local notification:', error);
      throw error;
    }
  }

  /**
   * Schedule a notification for a specific time
   */
  async scheduleReminder(
    title: string,
    body: string,
    date: Date,
    data?: Record<string, any>
  ): Promise<string> {
    return this.sendLocalNotification({
      title,
      body,
      data,
      trigger: {
        type: 'date',
        date,
      },
    });
  }

  /**
   * Schedule daily notification at specific time
   */
  async scheduleDailyNotification(
    title: string,
    body: string,
    hour: number,
    minute: number
  ): Promise<string> {
    return this.sendLocalNotification({
      title,
      body,
      trigger: {
        type: 'daily',
        hour,
        minute,
      },
    });
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Cancel notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get push token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Setup notification event listeners
   */
  private setupNotificationListeners(): void {
    // Listen for notifications when app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received (foreground):', notification);
    });

    // Listen for notification responses (when user taps notification)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      // Handle notification tap
      const { notification } = response;
      this.handleNotificationTap(notification);
    });

    // Return unsubscribe functions for cleanup
    this.unsubscribe = () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }

  private unsubscribe: (() => void) | null = null;

  /**
   * Handle notification tap
   */
  private handleNotificationTap(notification: Notifications.Notification): void {
    const { data } = notification.request.content;
    console.log('User tapped notification with data:', data);
    // Navigation or other actions can be performed here
  }

  /**
   * Send event reminder notifications
   */
  async sendEventReminder(
    eventTitle: string,
    eventDate: string,
    minutesBefore: number = 15
  ): Promise<string> {
    const reminderDate = new Date(eventDate);
    reminderDate.setMinutes(reminderDate.getMinutes() - minutesBefore);

    return this.scheduleReminder(
      'Ereigniserinnerung',
      `${eventTitle} findet in ${minutesBefore} Minuten statt`,
      reminderDate,
      { eventTitle, minutesBefore }
    );
  }

  /**
   * Send conflict alert notification
   */
  async sendConflictAlert(eventTitle: string, conflictReason: string): Promise<string> {
    return this.sendLocalNotification({
      title: 'Terminkonflikt erkannt',
      body: `${eventTitle}: ${conflictReason}`,
      data: { type: 'conflict', eventTitle },
      trigger: { seconds: 1 },
    });
  }

  /**
   * Shutdown notification manager
   */
  async shutdown(): Promise<void> {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    await this.cancelAllNotifications();
  }
}
