/**
 * Hook for managing smart notifications
 * Provides easy access to notification event logging and manual triggers
 */

import { useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { smartNotificationService } from '@/services/smartNotificationService';

export const useSmartNotifications = () => {
  const { user } = useUser();

  /**
   * Log when a notification is delivered to the device
   */
  const logNotificationDelivered = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await smartNotificationService.logNotificationEvent(user.id, 'delivered');
    } catch (error) {
      console.error('Error logging notification delivered event:', error);
    }
  }, [user?.id]);

  /**
   * Log when a user clicks/interacts with a notification
   */
  const logNotificationClicked = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await smartNotificationService.logNotificationEvent(user.id, 'clicked');
    } catch (error) {
      console.error('Error logging notification clicked event:', error);
    }
  }, [user?.id]);

  /**
   * Manually trigger the daily notification service (for testing/admin)
   */
  const triggerDailyService = useCallback(async () => {
    try {
      await smartNotificationService.runDailyNotificationService();
      console.log('Daily notification service triggered manually');
    } catch (error) {
      console.error('Error triggering daily notification service:', error);
    }
  }, []);

  /**
   * Check if smart notifications are enabled for the current user
   */
  const isSmartNotificationsEnabled = useCallback(() => {
    return !!(
      user?.preferredStudyWeekdays?.length && 
      user?.preferredStudyStartTime &&
      'Notification' in window &&
      Notification.permission === 'granted'
    );
  }, [user?.preferredStudyWeekdays, user?.preferredStudyStartTime]);

  return {
    logNotificationDelivered,
    logNotificationClicked,
    triggerDailyService,
    isSmartNotificationsEnabled
  };
};