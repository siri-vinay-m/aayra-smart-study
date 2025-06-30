/**
 * Mobile Notification Service for Android and iOS push notifications
 * Uses Capacitor's PushNotifications plugin for native mobile notifications
 */

import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationPermissionStatus {
  receive: 'granted' | 'denied' | 'prompt';
}

export class MobileNotificationService {
  private static instance: MobileNotificationService;
  private isInitialized = false;
  private registrationToken: string | null = null;

  static getInstance(): MobileNotificationService {
    if (!MobileNotificationService.instance) {
      MobileNotificationService.instance = new MobileNotificationService();
    }
    return MobileNotificationService.instance;
  }

  /**
   * Initialize the mobile notification service
   * Sets up listeners and handles platform-specific initialization
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Only initialize on mobile platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('Mobile notifications not available on web platform');
      return;
    }

    try {
      // Add listeners for push notification events
      await this.addListeners();
      this.isInitialized = true;
      console.log('Mobile notification service initialized successfully');
    } catch (error) {
      console.error('Error initializing mobile notification service:', error);
      throw error;
    }
  }

  /**
   * Request permission for push notifications
   * Returns true if permission is granted, false otherwise
   */
  async requestPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Cannot request mobile notification permission on web platform');
      return false;
    }

    try {
      // Initialize if not already done
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Request permission
      const result = await PushNotifications.requestPermissions();
      
      if (result.receive === 'granted') {
        console.log('Push notification permission granted');
        
        // Register for push notifications
        await PushNotifications.register();
        return true;
      } else {
        console.log('Push notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting push notification permission:', error);
      return false;
    }
  }

  /**
   * Check current permission status
   */
  async checkPermissions(): Promise<NotificationPermissionStatus> {
    if (!Capacitor.isNativePlatform()) {
      return { receive: 'denied' };
    }

    try {
      const result = await PushNotifications.checkPermissions();
      return result;
    } catch (error) {
      console.error('Error checking push notification permissions:', error);
      return { receive: 'denied' };
    }
  }

  /**
   * Get the current registration token
   */
  getRegistrationToken(): string | null {
    return this.registrationToken;
  }

  /**
   * Schedule a local notification
   * For immediate notifications that don't require server push
   */
  async scheduleLocalNotification(title: string, body: string, delay: number = 0): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Local notifications not available on web platform');
      return;
    }

    try {
      // Import LocalNotifications dynamically
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      // Request permission for local notifications
      const permission = await LocalNotifications.requestPermissions();
      
      if (permission.display === 'granted') {
        const notificationTime = new Date(Date.now() + delay);
        
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Date.now(),
              schedule: { at: notificationTime },
              sound: 'default',
              attachments: undefined,
              actionTypeId: '',
              extra: {
                type: 'study_reminder'
              }
            }
          ]
        });
        
        console.log('Local notification scheduled successfully');
      } else {
        console.log('Local notification permission denied');
      }
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }

  /**
   * Add event listeners for push notifications
   */
  private async addListeners(): Promise<void> {
    // Listen for registration token
    await PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      this.registrationToken = token.value;
      
      // Here you would typically send the token to your backend server
      // to associate it with the user for sending push notifications
      this.sendTokenToServer(token.value);
    });

    // Listen for registration errors
    await PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Listen for push notifications received
    await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received: ', notification);
      
      // Handle the received notification
      this.handleNotificationReceived(notification);
    });

    // Listen for notification actions (when user taps notification)
    await PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed: ', notification);
      
      // Handle notification tap/action
      this.handleNotificationAction(notification);
    });
  }

  /**
   * Send registration token to your backend server
   * This is where you would integrate with your backend API
   */
  private async sendTokenToServer(token: string): Promise<void> {
    try {
      // TODO: Implement API call to your backend
      // Example:
      // await fetch('/api/register-push-token', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token, userId: currentUserId })
      // });
      
      console.log('Token should be sent to server:', token);
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  }

  /**
   * Handle received push notification
   */
  private handleNotificationReceived(notification: PushNotificationSchema): void {
    // You can customize how notifications are handled when received
    console.log('Handling received notification:', notification.title);
    
    // Example: Show a toast or update app state
    // You might want to emit an event or update a global state here
  }

  /**
   * Handle notification action (when user taps notification)
   */
  private handleNotificationAction(action: ActionPerformed): void {
    console.log('Handling notification action:', action.notification.title);
    
    // Navigate to specific screen based on notification data
    const notificationData = action.notification.data;
    
    if (notificationData?.type === 'study_reminder') {
      // Navigate to study session or timer page
      console.log('Navigating to study session...');
    } else if (notificationData?.type === 'review_reminder') {
      // Navigate to pending reviews page
      console.log('Navigating to pending reviews...');
    }
    
    // You would typically use your app's navigation system here
    // Example: router.push('/study-session');
  }

  /**
   * Remove all listeners (cleanup)
   */
  async removeAllListeners(): Promise<void> {
    await PushNotifications.removeAllListeners();
    this.isInitialized = false;
    console.log('All push notification listeners removed');
  }
}

// Export singleton instance
export const mobileNotificationService = MobileNotificationService.getInstance();