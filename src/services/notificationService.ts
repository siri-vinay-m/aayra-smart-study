
export class NotificationService {
  private static instance: NotificationService;
  private scheduledNotifications: Map<string, number> = new Map();

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  showNotification(title: string, body: string, icon?: string): void {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'study-reminder',
        requireInteraction: true
      });
    }
  }

  scheduleStudyReminders(weekdays: string[], startTime: string): void {
    // Clear existing notifications
    this.clearAllNotifications();

    if (!weekdays.length || !startTime) {
      return;
    }

    const [hours, minutes] = startTime.split(':').map(Number);
    
    weekdays.forEach(weekday => {
      this.scheduleWeeklyNotification(weekday, hours, minutes);
    });
  }

  private scheduleWeeklyNotification(weekday: string, hours: number, minutes: number): void {
    const weekdayMap: { [key: string]: number } = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    };

    const targetDay = weekdayMap[weekday];
    if (targetDay === undefined) return;

    const scheduleNextNotification = () => {
      const now = new Date();
      const targetTime = new Date();
      
      // Set target time to the study time minus 15 minutes
      targetTime.setHours(hours, minutes - 15, 0, 0);
      
      // Calculate days until target weekday
      const currentDay = now.getDay();
      let daysUntilTarget = targetDay - currentDay;
      
      if (daysUntilTarget < 0 || (daysUntilTarget === 0 && now > targetTime)) {
        daysUntilTarget += 7; // Schedule for next week
      }
      
      targetTime.setDate(now.getDate() + daysUntilTarget);
      
      const timeUntilNotification = targetTime.getTime() - now.getTime();
      
      if (timeUntilNotification > 0) {
        const timeoutId = window.setTimeout(() => {
          this.showNotification(
            'Study Time Reminder',
            `Your study session starts in 15 minutes! Time to prepare.`,
            '/favicon.ico'
          );
          
          // Schedule the next week's notification
          scheduleNextNotification();
        }, timeUntilNotification);
        
        this.scheduledNotifications.set(`${weekday}-reminder`, timeoutId);
        
        console.log(`Scheduled notification for ${weekday} at ${targetTime.toLocaleString()}`);
      }
    };

    scheduleNextNotification();
  }

  clearAllNotifications(): void {
    this.scheduledNotifications.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.scheduledNotifications.clear();
  }

  clearNotificationsForUser(): void {
    this.clearAllNotifications();
  }
}

export const notificationService = NotificationService.getInstance();
