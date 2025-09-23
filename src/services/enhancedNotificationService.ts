/**
 * Enhanced Notification Service
 * Combines smart notifications with immediate testing capabilities
 */

import { supabase } from '@/integrations/supabase/client';
import { notificationService } from './notificationService';
import { smartNotificationService } from './smartNotificationService';
import { registerServiceWorker } from '@/utils/serviceWorkerRegistration';

export interface NotificationTestResult {
  success: boolean;
  message: string;
  details?: any;
}

export class EnhancedNotificationService {
  private static instance: EnhancedNotificationService;
  private isInitialized = false;
  private serviceWorkerReady = false;

  static getInstance(): EnhancedNotificationService {
    if (!EnhancedNotificationService.instance) {
      EnhancedNotificationService.instance = new EnhancedNotificationService();
    }
    return EnhancedNotificationService.instance;
  }

  /**
   * Initialize the enhanced notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing enhanced notification service...');

      // Register service worker first
      const swResult = await registerServiceWorker();
      this.serviceWorkerReady = swResult.success;
      
      if (swResult.success) {
        console.log('✅ Service worker registered successfully');
      } else {
        console.warn('⚠️ Service worker registration failed:', swResult.error);
      }

      // Initialize smart notification service
      await smartNotificationService.initialize();
      console.log('✅ Smart notification service initialized');

      // Request notification permissions
      const permissionGranted = await notificationService.requestPermission();
      console.log('✅ Notification permission:', permissionGranted ? 'granted' : 'denied');

      this.isInitialized = true;
      console.log('✅ Enhanced notification service fully initialized');
    } catch (error) {
      console.error('❌ Error initializing enhanced notification service:', error);
      throw error;
    }
  }

  /**
   * Test immediate notification (for debugging)
   */
  async sendTestNotification(): Promise<NotificationTestResult> {
    try {
      if (Notification.permission !== 'granted') {
        const permission = await notificationService.requestPermission();
        if (!permission) {
          return {
            success: false,
            message: 'Notification permission denied'
          };
        }
      }

      // Send test notification
      notificationService.showNotification(
        '🧪 Test Notification',
        'This is a test notification from Aayra Smart Study. Your notification system is working!',
        '/favicon.png',
        true
      );

      return {
        success: true,
        message: 'Test notification sent successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send test notification',
        details: error
      };
    }
  }

  /**
   * Simulate smart notification based on user data
   */
  async sendSmartTestNotification(userId: string): Promise<NotificationTestResult> {
    try {
      // Get user data
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return {
          success: false,
          message: 'Could not fetch user data for smart notification'
        };
      }

      // Get pending reviews
      const { data: pendingReviews } = await supabase
        .from('reviewcycleentries')
        .select(`
          *,
          studysessions (
            sessionid,
            sessionname,
            subjectname,
            topicname
          )
        `)
        .eq('userid', userId)
        .eq('status', 'pending')
        .limit(1);

      let title = 'Smart Study Reminder';
      let body = 'Time to study! Your learning journey continues.';

      if (pendingReviews && pendingReviews.length > 0) {
        const review = pendingReviews[0] as any;
        const session = (review as any).studysessions;
        title = 'Review Time!';
        body = `📚 Ready to review ${session?.topicname || 'your topic'} in ${session?.subjectname || 'your subject'}? Let's strengthen your knowledge!`;
      } else {
        // Check for recent sessions
        const { data: recentSessions } = await supabase
          .from('studysessions')
          .select('*')
          .eq('userid', userId)
          .eq('status', 'completed')
          .order('completedat', { ascending: false })
          .limit(1);

        if (recentSessions && recentSessions.length > 0) {
          const session = recentSessions[0] as any;
          title = 'Smart Recap Time!';
          body = `🧠 Let's reinforce what you learned about ${session.topicname || 'your recent topic'}! Quick review session ready.`;
        }
      }

      // Send notification
      notificationService.showNotification(title, body, '/favicon.png', true);

      // Skip database logging for now since notification_logs table doesn't exist

      return {
        success: true,
        message: 'Smart test notification sent successfully',
        details: { title, body }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send smart test notification',
        details: error
      };
    }
  }

  /**
   * Manually trigger the daily notification service (for testing)
   */
  async triggerDailyServiceTest(): Promise<NotificationTestResult> {
    try {
      console.log('🔄 Triggering daily notification service...');
      
      // Run the daily service
      await smartNotificationService.runDailyNotificationService();
      
      return {
        success: true,
        message: 'Daily notification service triggered successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to trigger daily notification service',
        details: error
      };
    }
  }

  /**
   * Get notification system status
   */
  async getSystemStatus(): Promise<any> {
    const status = {
      serviceWorkerSupported: 'serviceWorker' in navigator,
      serviceWorkerRegistered: this.serviceWorkerReady,
      notificationSupported: 'Notification' in window,
      notificationPermission: 'Notification' in window ? Notification.permission : 'not-supported',
      enhancedServiceInitialized: this.isInitialized,
    } as any;

    // Check for active service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/');
        (status as any).serviceWorkerActive = !!registration?.active;
      } catch (error) {
        (status as any).serviceWorkerActive = false;
      }
    }

    return status;
  }

  /**
   * Schedule a notification for immediate testing (1 minute delay)
   */
  async scheduleTestNotification(userId: string, delayMinutes: number = 1): Promise<NotificationTestResult> {
    try {
      const scheduledTime = new Date();
      scheduledTime.setMinutes(scheduledTime.getMinutes() + delayMinutes);

      const title = '⏰ Scheduled Test Notification';
      const body = `This notification was scheduled for ${scheduledTime.toLocaleTimeString()}. Your scheduling system works!`;

      // Schedule the notification
      setTimeout(() => {
        notificationService.showNotification(title, body, '/favicon.png', true);
      }, delayMinutes * 60 * 1000);

      // Skip database logging for now since notification_logs table doesn't exist

      return {
        success: true,
        message: `Test notification scheduled for ${scheduledTime.toLocaleTimeString()}`,
        details: { scheduledTime, title, body }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to schedule test notification',
        details: error
      };
    }
  }
}

export const enhancedNotificationService = EnhancedNotificationService.getInstance();