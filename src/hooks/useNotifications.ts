import { notificationService } from '@/services/notificationService';

export const useNotifications = () => {
  const requestNotificationPermission = async (): Promise<boolean> => {
    return await notificationService.requestPermission();
  };

  const scheduleNotification = (title: string, body: string, delay: number = 0): void => {
    if (delay > 0) {
      setTimeout(() => {
        notificationService.showNotification(title, body);
      }, delay);
    } else {
      notificationService.showNotification(title, body);
    }
  };

  return {
    requestNotificationPermission,
    scheduleNotification
  };
};