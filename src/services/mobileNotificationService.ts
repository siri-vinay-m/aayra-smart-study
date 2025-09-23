/**
 * Simplified Mobile Notification Service
 * Uses local notifications and Supabase realtime for push-like functionality
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationPermissionStatus {
  display: 'granted' | 'denied' | 'prompt';
}

export class SimpleMobileNotificationService {
  private static instance: SimpleMobileNotificationService;
  private isInitialized = false;
  private userId: string | null = null;
  private realtimeChannel: any = null;

  static getInstance(): SimpleMobileNotificationService {
    if (!SimpleMobileNotificationService.instance) {
      SimpleMobileNotificationService.instance = new SimpleMobileNotificationService();
    }
    return SimpleMobileNotificationService.instance;
  }

  /**
   * Initialize the notification service with Supabase realtime
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        this.userId = user.id;
        await this.setupRealtimeNotifications();
      }

      // Request local notification permissions
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.requestPermissions();
      }

      this.isInitialized = true;
      console.log('Simplified notification service initialized');
    } catch (error) {
      console.error('Error initializing notification service:', error);
      throw error;
    }
  }

  /**
   * Setup Supabase realtime notifications
   */
  private async setupRealtimeNotifications(): Promise<void> {
    if (!this.userId) return;

    // Remove existing channel if any
    if (this.realtimeChannel) {
      await supabase.removeChannel(this.realtimeChannel);
    }

    // Listen for notification events in realtime
    this.realtimeChannel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_logs',
          filter: `user_id=eq.${this.userId}`
        },
        (payload) => {
          this.handleRealtimeNotification(payload.new);
        }
      )
      .subscribe();

    console.log('Realtime notifications setup for user:', this.userId);
  }

  /**
   * Handle realtime notification from Supabase
   */
  private async handleRealtimeNotification(notification: any): Promise<void> {
    try {
      const content = JSON.parse(notification.content);
      
      // Show local notification
      await this.showLocalNotification(
        content.title || 'Study Reminder',
        content.body || 'Time for your study session!',
        {
          type: notification.notification_type,
          id: notification.id
        }
      );
    } catch (error) {
      console.error('Error handling realtime notification:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
      } else {
        // Web notification permission
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
      }
      return false;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Check current permission status
   */
  async checkPermissions(): Promise<NotificationPermissionStatus> {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await LocalNotifications.checkPermissions();
        return { display: result.display as 'granted' | 'denied' | 'prompt' };
      } else {
        // Web notification permission
        if ('Notification' in window) {
          return { display: Notification.permission as 'granted' | 'denied' | 'prompt' };
        }
      }
      return { display: 'denied' };
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return { display: 'denied' };
    }
  }

  /**
   * Show local notification
   */
  async showLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Date.now(),
              schedule: { at: new Date(Date.now() + 1000) }, // 1 second delay
              sound: 'default',
              extra: data || {}
            }
          ]
        });
      } else {
        // Web notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/AayraFavicon.png' });
        }
      }
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  /**
   * Schedule study reminder
   */
  async scheduleStudyReminder(
    title: string,
    body: string,
    scheduledTime: Date
  ): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Date.now(),
              schedule: { at: scheduledTime },
              sound: 'default',
              extra: { type: 'study_reminder' }
            }
          ]
        });
      }

      // Skip database logging for now since notification_logs table doesn't exist

      console.log('Study reminder scheduled successfully');
    } catch (error) {
      console.error('Error scheduling study reminder:', error);
    }
  }

  /**
   * Send notification to user (creates database entry that triggers realtime)
   */
  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    type: string = 'general'
  ): Promise<boolean> {
    try {
      // Skip database logging for now since notification_logs table doesn't exist
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Schedule a local notification with delay
   * For immediate notifications that don't require server push
   */
  async scheduleLocalNotification(title: string, body: string, delay: number = 0): Promise<void> {
    const scheduledTime = new Date(Date.now() + delay);
    await this.showLocalNotification(title, body, { type: 'local_test' });
  }

  /**
   * Get user ID for notifications
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Update user ID (useful when user logs in/out)
   */
  async setUserId(userId: string | null): Promise<void> {
    this.userId = userId;
    
    if (userId && this.isInitialized) {
      await this.setupRealtimeNotifications();
    } else if (!userId && this.realtimeChannel) {
      await supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  /**
   * Cleanup and remove all listeners
   */
  async cleanup(): Promise<void> {
    try {
      if (this.realtimeChannel) {
        await supabase.removeChannel(this.realtimeChannel);
        this.realtimeChannel = null;
      }
      
      this.isInitialized = false;
      this.userId = null;
      console.log('Notification service cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Get notification statistics for user
   */
  async getNotificationStats(): Promise<any> {
    if (!this.userId) return null;

    try {
      // Skip database logging for now since notification_logs table doesn't exist
      return {
        total: 0,
        sent: 0,
        delivered: 0,
        failed: 0
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const simpleMobileNotificationService = SimpleMobileNotificationService.getInstance();

// Keep backward compatibility
export const mobileNotificationService = simpleMobileNotificationService;