
import { useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { notificationService } from '@/services/notificationService';

export const useStudyReminders = () => {
  const { user } = useUser();

  useEffect(() => {
    const setupNotifications = async () => {
      if (!user) {
        notificationService.clearAllNotifications();
        return;
      }

      // Request notification permission
      const hasPermission = await notificationService.requestPermission();
      
      if (!hasPermission) {
        console.log('Notification permission denied');
        return;
      }

      // Schedule reminders based on user preferences
      if (user.preferredStudyWeekdays && user.preferredStudyStartTime) {
        notificationService.scheduleStudyReminders(
          user.preferredStudyWeekdays,
          user.preferredStudyStartTime
        );
      }
    };

    setupNotifications();

    // Cleanup on unmount or user change
    return () => {
      if (!user) {
        notificationService.clearAllNotifications();
      }
    };
  }, [user?.preferredStudyWeekdays, user?.preferredStudyStartTime, user?.id]);

  return {
    requestNotificationPermission: () => notificationService.requestPermission(),
    clearReminders: () => notificationService.clearAllNotifications()
  };
};
