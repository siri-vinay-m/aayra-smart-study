
/**
 * Notification service for managing study reminders and push notifications
 */
export class NotificationService {
  private static instance: NotificationService;
  private scheduledNotifications: Map<string, number> = new Map();
  private audioContext: AudioContext | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize audio context for sound alerts
   */
  private initAudioContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Play notification sound alert
   */
  private playNotificationSound(): void {
    try {
      this.initAudioContext();
      if (!this.audioContext) return;

      // Create a simple notification sound using Web Audio API
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  /**
   * Generate AI-powered personalized notification message
   */
  private generatePersonalizedMessage(userStats: any, minutesBefore: number): string {
    const messages15min = [
      `📚 You've got ${userStats.pendingReviews || 0} sessions pending. Let's conquer them—study starts in 15 minutes!`,
      `🔥 You're on a ${userStats.streak || 0}-day streak. Let's make it ${(userStats.streak || 0) + 1}! Prep time starts now.`,
      `🎯 Only ${userStats.sessionsToGoal || 0} more sessions to hit your weekly goal. Session starts in 15.`,
      `🧠 Your average focus time is improving! Ride the momentum—study in 15.`,
      `⚡ Time to boost that ${userStats.completionRate || 0}% completion rate! Get ready to focus.`,
      `🌟 ${userStats.totalSessions || 0} sessions completed so far. Add another one in 15 minutes!`
    ];

    const messages5min = [
      `⏰ 5 minutes to study time! Your ${userStats.streak || 0}-day streak is counting on you.`,
      `🚀 Final countdown: 5 minutes! Time to tackle those ${userStats.pendingReviews || 0} pending reviews.`,
      `💪 5 minutes left to prepare. You're ${userStats.weeklyProgress || 0}% towards your weekly goal!`,
      `🎯 Almost time! 5 minutes to show what ${userStats.totalSessions || 0} sessions of experience can do.`,
      `⭐ 5 minutes to greatness! Your focus journey continues now.`
    ];

    const messageArray = minutesBefore === 15 ? messages15min : messages5min;
    const fallbackMessage = minutesBefore === 15 
      ? "⏰ Your study session starts in 15 minutes! Get ready to focus."
      : "⏰ Your study session starts in 5 minutes! Time to focus.";

    if (!userStats || Object.keys(userStats).length === 0) {
      return fallbackMessage;
    }

    // Select message based on available user data
    if (userStats.pendingReviews > 0) {
      return messageArray[0];
    } else if (userStats.streak > 0) {
      return messageArray[1];
    } else if (userStats.sessionsToGoal > 0) {
      return messageArray[2];
    } else {
      return messageArray[Math.floor(Math.random() * messageArray.length)];
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    // Check if already granted
    if (Notification.permission === 'granted') {
      return true;
    }

    // Don't request if explicitly denied
    if (Notification.permission === 'denied') {
      console.log('Notifications are blocked by the user');
      return false;
    }

    try {
      // Request permission and wait for user response
      const permission = await Notification.requestPermission();
      console.log('Notification permission result:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  showNotification(title: string, body: string, icon?: string, playSound: boolean = true): void {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'study-reminder',
          requireInteraction: true
        });
        
        if (playSound) {
          this.playNotificationSound();
        }
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
  }

  scheduleStudyReminders(weekdays: string[], startTime: string, userStats?: any): void {
    // Clear existing notifications
    this.clearAllNotifications();

    if (!weekdays.length || !startTime) {
      return;
    }

    const [hours, minutes] = startTime.split(':').map(Number);
    
    weekdays.forEach(weekday => {
      this.scheduleWeeklyNotification(weekday, hours, minutes, userStats);
    });
  }

  private scheduleWeeklyNotification(weekday: string, hours: number, minutes: number, userStats?: any): void {
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
      
      // Schedule 15-minute notification
      const targetTime15 = new Date();
      targetTime15.setHours(hours, minutes - 15, 0, 0);
      
      // Schedule 5-minute notification
      const targetTime5 = new Date();
      targetTime5.setHours(hours, minutes - 5, 0, 0);
      
      // Calculate days until target weekday
      const currentDay = now.getDay();
      let daysUntilTarget = targetDay - currentDay;
      
      if (daysUntilTarget < 0 || (daysUntilTarget === 0 && now > targetTime15)) {
        daysUntilTarget += 7; // Schedule for next week
      }
      
      targetTime15.setDate(now.getDate() + daysUntilTarget);
      targetTime5.setDate(now.getDate() + daysUntilTarget);
      
      // Schedule 15-minute notification
      const timeUntil15min = targetTime15.getTime() - now.getTime();
      if (timeUntil15min > 0) {
        const timeoutId15 = window.setTimeout(() => {
          const message = this.generatePersonalizedMessage(userStats, 15);
          this.showNotification(
            'Study Time Reminder',
            message,
            '/favicon.ico',
            true
          );
        }, timeUntil15min);
        
        this.scheduledNotifications.set(`${weekday}-15min`, timeoutId15);
        console.log(`Scheduled 15-min notification for ${weekday} at ${targetTime15.toLocaleString()}`);
      }
      
      // Schedule 5-minute notification
      const timeUntil5min = targetTime5.getTime() - now.getTime();
      if (timeUntil5min > 0) {
        const timeoutId5 = window.setTimeout(() => {
          const message = this.generatePersonalizedMessage(userStats, 5);
          this.showNotification(
            'Study Time Reminder',
            message,
            '/favicon.ico',
            true
          );
          
          // Schedule the next week's notifications
          scheduleNextNotification();
        }, timeUntil5min);
        
        this.scheduledNotifications.set(`${weekday}-5min`, timeoutId5);
        console.log(`Scheduled 5-min notification for ${weekday} at ${targetTime5.toLocaleString()}`);
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
