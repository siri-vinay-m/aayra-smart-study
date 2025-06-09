
import { useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useSession } from '@/contexts/SessionContext';
import { notificationService } from '@/services/notificationService';

export const useStudyReminders = () => {
  const { user } = useUser();
  const { pendingReviews, completedSessions } = useSession();

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

      // Calculate user stats for personalized notifications
      const userStats = calculateUserStats();
      
      // Schedule reminders based on user preferences
      if (user.preferredStudyWeekdays && user.preferredStudyStartTime) {
        notificationService.scheduleStudyReminders(
          user.preferredStudyWeekdays,
          user.preferredStudyStartTime,
          userStats
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
  }, [user?.preferredStudyWeekdays, user?.preferredStudyStartTime, user?.id, pendingReviews, completedSessions]);

  const calculateUserStats = () => {
    if (!completedSessions || !user) {
      return {
        totalSessions: 0,
        pendingReviews: pendingReviews?.length || 0,
        streak: 0,
        weeklyProgress: 0,
        completionRate: 0,
        sessionsToGoal: user?.weeklyGoal || 10
      };
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Calculate weekly sessions
    const weeklySessionsCount = completedSessions.filter(session => {
      if (!session.completedAt) return false;
      const completedDate = new Date(session.completedAt);
      return completedDate >= startOfWeek;
    }).length;

    // Calculate study streak
    const streak = calculateStudyStreak(completedSessions);

    // Calculate weekly progress
    const weeklyGoal = user.weeklyGoal || 10;
    const weeklyProgress = Math.round((weeklySessionsCount / weeklyGoal) * 100);

    // Calculate completion rate (simplified)
    const completionRate = completedSessions.length > 0 ? 
      Math.round((completedSessions.length / (completedSessions.length + (pendingReviews?.length || 0))) * 100) : 0;

    return {
      totalSessions: completedSessions.length,
      pendingReviews: pendingReviews?.length || 0,
      streak,
      weeklyProgress,
      completionRate,
      sessionsToGoal: Math.max(0, weeklyGoal - weeklySessionsCount)
    };
  };

  const calculateStudyStreak = (sessions: any[]): number => {
    if (!sessions || sessions.length === 0) return 0;

    // Group sessions by date
    const sessionsByDate = new Map<string, boolean>();
    sessions.forEach(session => {
      if (session.completedAt) {
        const dateKey = new Date(session.completedAt).toDateString();
        sessionsByDate.set(dateKey, true);
      }
    });

    // Calculate consecutive days from today backwards
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) { // Max 365 days check
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateKey = checkDate.toDateString();
      
      if (sessionsByDate.has(dateKey)) {
        streak++;
      } else if (i > 0) { // Don't break on first day (today) if no session
        break;
      }
    }

    return streak;
  };

  return {
    requestNotificationPermission: () => notificationService.requestPermission(),
    clearReminders: () => notificationService.clearAllNotifications()
  };
};
