/**
 * Smart Push Notification Service
 * Implements intelligent notification system that sends personalized notifications
 * 10 minutes before user's preferred study time based on their profile settings
 */

import { supabase } from '@/integrations/supabase/client';
import { notificationService } from './notificationService';

interface UserNotificationData {
  userId: string;
  preferredStudyWeekdays: string[];
  preferredStudyStartTime: string;
  pendingReviews: any[];
  recentSessions: any[];
  userStats: any;
}

interface NotificationContent {
  title: string;
  body: string;
  type: 'pending_review' | 'smart_recap' | 'motivational' | 'ai_tip';
  sourceData?: any;
}

interface NotificationLog {
  userId: string;
  notificationType: string;
  content: string;
  scheduledTime: string;
  sentTime?: string;
  deliveredTime?: string;
  clickedTime?: string;
  status: 'scheduled' | 'sent' | 'delivered' | 'clicked' | 'failed';
}

export class SmartNotificationService {
  private static instance: SmartNotificationService;
  private notificationLogs: Map<string, NotificationLog> = new Map();

  static getInstance(): SmartNotificationService {
    if (!SmartNotificationService.instance) {
      SmartNotificationService.instance = new SmartNotificationService();
    }
    return SmartNotificationService.instance;
  }

  /**
   * Main daily service runner - checks all users and schedules notifications
   * This should be called once daily (ideally at midnight)
   */
  async runDailyNotificationService(): Promise<void> {
    try {
      console.log('Starting daily notification service...');
      
      // Get all users with notification preferences
      const users = await this.getAllUsersWithPreferences();
      
      for (const user of users) {
        await this.processUserNotifications(user);
      }
      
      console.log(`Daily notification service completed for ${users.length} users`);
    } catch (error) {
      console.error('Error in daily notification service:', error);
      await this.logError('daily_service_error', error);
    }
  }

  /**
   * Get all users who have notification preferences set
   */
  private async getAllUsersWithPreferences(): Promise<UserNotificationData[]> {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .not('preferredstudyweekdays', 'is', null)
      .not('preferredstudystarttime', 'is', null);

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    const userNotificationData: UserNotificationData[] = [];

    for (const user of users || []) {
      try {
        // Get pending reviews for this user
        const pendingReviews = await this.getUserPendingReviews(user.id);
        
        // Get recent sessions for smart recap
        const recentSessions = await this.getUserRecentSessions(user.id);
        
        // Calculate user stats
        const userStats = await this.calculateUserStats(user.id, pendingReviews, recentSessions);

        userNotificationData.push({
          userId: user.id,
          preferredStudyWeekdays: user.preferredstudyweekdays || [],
          preferredStudyStartTime: user.preferredstudystarttime || '',
          pendingReviews,
          recentSessions,
          userStats
        });
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
      }
    }

    return userNotificationData;
  }

  /**
   * Process notifications for a single user
   */
  private async processUserNotifications(userData: UserNotificationData): Promise<void> {
    const today = new Date();
    const todayWeekday = this.getDayName(today.getDay());
    
    // Check if today is one of the user's preferred study days
    if (!userData.preferredStudyWeekdays.includes(todayWeekday)) {
      console.log(`Skipping user ${userData.userId} - today (${todayWeekday}) is not a preferred study day`);
      return;
    }

    // Check if there are pending reviews within the next 24 hours
    const hasPendingReviews = await this.hasPendingReviewsWithin24Hours(userData.userId);
    
    if (!hasPendingReviews && userData.pendingReviews.length === 0) {
      console.log(`Skipping user ${userData.userId} - no pending reviews within 24 hours`);
      return;
    }

    // Generate notification content
    const notificationContent = await this.generateNotificationContent(userData);
    
    // Schedule notification 10 minutes before preferred time
    await this.scheduleNotification(userData, notificationContent);
  }

  /**
   * Get pending reviews for a user
   */
  private async getUserPendingReviews(userId: string): Promise<any[]> {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const { data: reviewEntries, error } = await supabase
      .from('reviewcycleentries')
      .select(`
        *,
        studysessions (
          sessionid,
          sessionname,
          subjectname,
          topicname,
          lastreviewedat,
          createdat
        )
      `)
      .eq('userid', userId)
      .eq('status', 'pending')
      .lte('currentreviewduedate', currentDate)
      .order('currentreviewduedate', { ascending: true });

    if (error) {
      console.error('Error fetching pending reviews:', error);
      return [];
    }

    return reviewEntries || [];
  }

  /**
   * Get recent completed sessions for smart recap
   */
  private async getUserRecentSessions(userId: string): Promise<any[]> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const { data: sessions, error } = await supabase
      .from('studysessions')
      .select('*')
      .eq('userid', userId)
      .eq('status', 'completed')
      .gte('completedat', threeDaysAgo.toISOString())
      .order('completedat', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recent sessions:', error);
      return [];
    }

    return sessions || [];
  }

  /**
   * Check if user has pending reviews within the next 24 hours
   */
  private async hasPendingReviewsWithin24Hours(userId: string): Promise<boolean> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    const { data: reviews, error } = await supabase
      .from('reviewcycleentries')
      .select('entryid')
      .eq('userid', userId)
      .eq('status', 'pending')
      .lte('currentreviewduedate', tomorrowDate)
      .limit(1);

    if (error) {
      console.error('Error checking pending reviews:', error);
      return false;
    }

    return (reviews?.length || 0) > 0;
  }

  /**
   * Calculate user statistics for personalized content
   */
  private async calculateUserStats(userId: string, pendingReviews: any[], recentSessions: any[]): Promise<any> {
    // Get total completed sessions
    const { data: allSessions, error } = await supabase
      .from('studysessions')
      .select('sessionid, completedat')
      .eq('userid', userId)
      .eq('status', 'completed');

    if (error) {
      console.error('Error fetching user stats:', error);
      return {
        totalSessions: 0,
        pendingReviews: pendingReviews.length,
        streak: 0,
        weeklyProgress: 0,
        completionRate: 0
      };
    }

    const totalSessions = allSessions?.length || 0;
    const streak = this.calculateStudyStreak(allSessions || []);
    const weeklyProgress = this.calculateWeeklyProgress(allSessions || []);
    const completionRate = this.calculateCompletionRate(totalSessions, pendingReviews.length);

    return {
      totalSessions,
      pendingReviews: pendingReviews.length,
      streak,
      weeklyProgress,
      completionRate
    };
  }

  /**
   * Generate personalized notification content
   */
  private async generateNotificationContent(userData: UserNotificationData): Promise<NotificationContent> {
    // Priority 1: Pending review question
    if (userData.pendingReviews.length > 0) {
      return this.generatePendingReviewContent(userData.pendingReviews[0], userData.userStats);
    }

    // Priority 2: Smart recap from recent session
    if (userData.recentSessions.length > 0) {
      return this.generateSmartRecapContent(userData.recentSessions[0], userData.userStats);
    }

    // Priority 3: Motivational message or AI tip
    return this.generateMotivationalContent(userData.userStats);
  }

  /**
   * Generate content for pending review notifications
   */
  private generatePendingReviewContent(pendingReview: any, userStats: any): NotificationContent {
    const session = pendingReview.studysessions;
    const subject = session?.subjectname || 'your subject';
    const topic = session?.topicname || 'the topic';
    
    const messages = [
      `📚 Time to review ${topic} in ${subject}! Your study session starts in 10 minutes.`,
      `🔄 ${topic} review is due! Get ready to reinforce your knowledge in 10 minutes.`,
      `⏰ Spaced repetition time! Review ${topic} (${subject}) - starting in 10 minutes.`,
      `🎯 Ready to tackle ${topic}? Your ${subject} review session begins in 10 minutes.`,
      `💡 ${topic} review awaits! Strengthen your ${subject} knowledge in 10 minutes.`
    ];

    const body = messages[Math.floor(Math.random() * messages.length)];

    return {
      title: 'Review Time!',
      body,
      type: 'pending_review',
      sourceData: { sessionId: session?.sessionid, subject, topic }
    };
  }

  /**
   * Generate smart recap content from recent sessions
   */
  private generateSmartRecapContent(recentSession: any, userStats: any): NotificationContent {
    const subject = recentSession.subjectname || 'your recent study';
    const topic = recentSession.topicname || 'the topic';
    
    const messages = [
      `🧠 Quick recap time! Test your knowledge of ${topic} from ${subject} - starting in 10 minutes.`,
      `⚡ Let's reinforce what you learned about ${topic}! Quiz time in 10 minutes.`,
      `🎓 Ready for a smart recap of ${topic}? Your ${subject} review starts in 10 minutes.`,
      `💭 Time to consolidate your ${topic} knowledge! Study session in 10 minutes.`,
      `🔍 Let's dive deeper into ${topic} concepts! Your ${subject} session begins in 10 minutes.`
    ];

    const body = messages[Math.floor(Math.random() * messages.length)];

    return {
      title: 'Smart Recap Time!',
      body,
      type: 'smart_recap',
      sourceData: { sessionId: recentSession.sessionid, subject, topic }
    };
  }

  /**
   * Generate motivational content when no reviews available
   */
  private generateMotivationalContent(userStats: any): NotificationContent {
    const motivationalMessages = [
      `🌟 You've completed ${userStats.totalSessions} sessions! Time to add another one in 10 minutes.`,
      `🔥 Keep your ${userStats.streak}-day streak alive! Study session starts in 10 minutes.`,
      `💪 Every session counts! Your learning journey continues in 10 minutes.`,
      `🎯 Consistency is key to mastery! Your study time begins in 10 minutes.`,
      `⭐ Great learners study regularly! Your session starts in 10 minutes.`
    ];

    const aiTips = [
      `💡 Tip: Use the Pomodoro technique! Study for 25 minutes, then take a 5-minute break. Starting in 10 minutes!`,
      `🧠 Tip: Active recall beats passive reading! Test yourself during your session in 10 minutes.`,
      `📝 Tip: Take notes by hand for better retention! Your study session starts in 10 minutes.`,
      `🔄 Tip: Review material within 24 hours for better memory consolidation! Session in 10 minutes.`,
      `🎯 Tip: Set specific learning goals for each session! Your focused study starts in 10 minutes.`
    ];

    const useAITip = Math.random() < 0.4; // 40% chance for AI tip
    const messages = useAITip ? aiTips : motivationalMessages;
    const body = messages[Math.floor(Math.random() * messages.length)];

    return {
      title: useAITip ? 'Study Tip!' : 'Study Time!',
      body,
      type: useAITip ? 'ai_tip' : 'motivational',
      sourceData: { userStats }
    };
  }

  /**
   * Schedule notification 10 minutes before preferred time
   */
  private async scheduleNotification(userData: UserNotificationData, content: NotificationContent): Promise<void> {
    const [hours, minutes] = userData.preferredStudyStartTime.split(':').map(Number);
    
    // Calculate notification time (10 minutes before)
    const notificationTime = new Date();
    notificationTime.setHours(hours, minutes - 10, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    const now = new Date();
    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }

    const timeUntilNotification = notificationTime.getTime() - now.getTime();
    
    if (timeUntilNotification > 0) {
      // Create notification log entry
      const logId = `${userData.userId}-${Date.now()}`;
      const notificationLog: NotificationLog = {
        userId: userData.userId,
        notificationType: content.type,
        content: content.body,
        scheduledTime: notificationTime.toISOString(),
        status: 'scheduled'
      };
      
      this.notificationLogs.set(logId, notificationLog);
      
      // Schedule the notification
      setTimeout(async () => {
        try {
          // Send notification
          notificationService.showNotification(
            content.title,
            content.body,
            '/favicon.ico',
            true
          );
          
          // Update log
          notificationLog.status = 'sent';
          notificationLog.sentTime = new Date().toISOString();
          
          // Store in database
          await this.storeNotificationLog(notificationLog);
          
          console.log(`Notification sent to user ${userData.userId}: ${content.body}`);
        } catch (error) {
          console.error('Error sending notification:', error);
          notificationLog.status = 'failed';
          await this.storeNotificationLog(notificationLog);
        }
      }, timeUntilNotification);
      
      console.log(`Scheduled notification for user ${userData.userId} at ${notificationTime.toLocaleString()}`);
    }
  }

  /**
   * Store notification log in database
   */
  private async storeNotificationLog(log: NotificationLog): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .insert({
          user_id: log.userId,
          notification_type: log.notificationType,
          content: log.content,
          scheduled_time: log.scheduledTime,
          sent_time: log.sentTime,
          delivered_time: log.deliveredTime,
          clicked_time: log.clickedTime,
          status: log.status
        });

      if (error) {
        console.error('Error storing notification log:', error);
      }
    } catch (error) {
      console.error('Error in storeNotificationLog:', error);
    }
  }

  /**
   * Log notification events (delivered, clicked)
   */
  async logNotificationEvent(userId: string, eventType: 'delivered' | 'clicked'): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .update({ 
          [`${eventType}_time`]: new Date().toISOString(),
          status: eventType
        })
        .eq('user_id', userId)
        .eq('status', eventType === 'delivered' ? 'sent' : 'delivered')
        .order('scheduled_time', { ascending: false })
        .limit(1);

      if (error) {
        console.error(`Error logging ${eventType} event:`, error);
      }
    } catch (error) {
      console.error(`Error in logNotificationEvent (${eventType}):`, error);
    }
  }

  /**
   * Helper functions
   */
  private getDayName(dayIndex: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  }

  private calculateStudyStreak(sessions: any[]): number {
    if (!sessions || sessions.length === 0) return 0;
    
    const sessionDates = sessions
      .filter(s => s.completedat)
      .map(s => new Date(s.completedat).toDateString())
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    const uniqueDates = [...new Set(sessionDates)];
    
    let streak = 0;
    const today = new Date().toDateString();
    let currentDate = new Date();
    
    for (const dateStr of uniqueDates) {
      const sessionDate = new Date(dateStr).toDateString();
      const expectedDate = currentDate.toDateString();
      
      if (sessionDate === expectedDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }

  private calculateWeeklyProgress(sessions: any[]): number {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weeklySessionsCount = sessions.filter(session => {
      if (!session.completedat) return false;
      const completedDate = new Date(session.completedat);
      return completedDate >= startOfWeek;
    }).length;
    
    const weeklyGoal = 7; // Default weekly goal
    return Math.round((weeklySessionsCount / weeklyGoal) * 100);
  }

  private calculateCompletionRate(totalSessions: number, pendingReviews: number): number {
    if (totalSessions === 0 && pendingReviews === 0) return 0;
    return Math.round((totalSessions / (totalSessions + pendingReviews)) * 100);
  }

  private async logError(type: string, error: any): Promise<void> {
    try {
      console.error(`Smart Notification Service Error (${type}):`, error);
      // Could store in database for monitoring
    } catch (e) {
      console.error('Error logging error:', e);
    }
  }

  /**
   * Initialize the service - should be called when app starts
   */
  async initialize(): Promise<void> {
    console.log('Smart Notification Service initialized');
    
    // Set up daily service runner (runs at midnight)
    this.scheduleDailyService();
  }

  /**
   * Schedule the daily service to run at midnight
   */
  private scheduleDailyService(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Midnight
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.runDailyNotificationService();
      
      // Set up recurring daily execution
      setInterval(() => {
        this.runDailyNotificationService();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, timeUntilMidnight);
    
    console.log(`Daily notification service scheduled to start at ${tomorrow.toLocaleString()}`);
  }
}

export const smartNotificationService = SmartNotificationService.getInstance();