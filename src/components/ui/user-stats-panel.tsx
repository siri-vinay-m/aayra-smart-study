import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useSession } from '@/contexts/SessionContext';
import { StudySession } from '@/types/session';
import { X, Trophy, Target, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface UserStatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * UserStatsPanel component displays user study statistics in a popup panel
 * Shows total sessions, weekly sessions, study streak, and weekly goal management
 */
const UserStatsPanel: React.FC<UserStatsPanelProps> = ({ isOpen, onClose }) => {
  const { user, setUser } = useUser();
  const { completedSessions } = useSession();
  const [weeklyGoal, setWeeklyGoal] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate stats based on completed sessions
  const calculateStats = () => {
    if (!completedSessions) {
      return {
        totalSessions: 0,
        weeklySessionsCount: 0,
        studyStreak: 0,
        weeklyProgress: 0
      };
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    // Filter sessions completed this week
    // Use createdAt as fallback if completedAt is not available
    const weeklySessionsCount = completedSessions.filter(session => {
      const completionDate = session.completedAt || session.createdAt;
      if (!completionDate) return false;
      const completedDate = new Date(completionDate);
      return completedDate >= startOfWeek;
    }).length;

    // Calculate study streak (consecutive days with completed sessions)
    const studyStreak = calculateStudyStreak(completedSessions);

    // Calculate weekly progress percentage
    const weeklyProgress = Math.round((weeklySessionsCount / weeklyGoal) * 100);

    return {
      totalSessions: completedSessions.length,
      weeklySessionsCount,
      studyStreak,
      weeklyProgress
    };
  };

  /**
   * Calculate consecutive days with study sessions
   */
  const calculateStudyStreak = (sessions: StudySession[]): number => {
    if (!sessions || sessions.length === 0) return 0;

    // Group sessions by date
    const sessionsByDate = new Map<string, boolean>();
    sessions.forEach(session => {
      const completionDate = session.completedAt || session.createdAt;
      if (completionDate) {
        const dateKey = new Date(completionDate).toDateString();
        sessionsByDate.set(dateKey, true);
      }
    });

    // Calculate streak from today backwards
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) { // Check up to a year back
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateKey = checkDate.toDateString();
      
      if (sessionsByDate.has(dateKey)) {
        streak++;
      } else if (i > 0) { // Don't break on first day (today) if no sessions
        break;
      }
    }

    return streak;
  };

  /**
   * Get streak milestone badge
   */
  const getStreakBadge = (streak: number): string | null => {
    const milestones = [7, 15, 25, 30, 50, 75, 100];
    const achievedMilestone = milestones.filter(m => streak >= m).pop();
    return achievedMilestone ? `${achievedMilestone} Day Milestone!` : null;
  };

  /**
   * Handle weekly goal change and persist to user profile
   */
  const handleGoalChange = async (newGoal: string) => {
    const goalValue = parseInt(newGoal);
    setWeeklyGoal(goalValue);
    setIsLoading(true);

    try {
      // Update user profile with new weekly goal
      const { error } = await supabase
        .from('profiles')
        .update({ weekly_study_goal: goalValue })
        .eq('id', user?.id);

      if (error) {
        console.error('Error updating weekly goal:', error);
      } else {
        // Update local user state
        setUser(prev => prev ? { ...prev, weeklyStudyGoal: goalValue } : null);
      }
    } catch (error) {
      console.error('Error saving weekly goal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load user's weekly goal from profile
   */
  useEffect(() => {
    const loadWeeklyGoal = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('weekly_study_goal')
          .eq('id', user.id)
          .single();

        if (data?.weekly_study_goal) {
          setWeeklyGoal(data.weekly_study_goal);
        }
      } catch (error) {
        console.error('Error loading weekly goal:', error);
      }
    };

    if (isOpen) {
      loadWeeklyGoal();
    }
  }, [isOpen, user?.id]);

  const stats = calculateStats();
  const streakBadge = getStreakBadge(stats.studyStreak);
  const daysInWeek = 7;
  const daysRemaining = daysInWeek - new Date().getDay();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-foreground">Study Stats</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats Content */}
        <div className="p-4 space-y-4">
          {/* Total Sessions */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg border">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-medium text-muted-foreground">All-Time</span>
            </div>
            <span className="text-xl font-bold text-primary">
              {stats.totalSessions} sessions
            </span>
          </div>

          {/* Weekly Sessions */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg border">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-medium text-muted-foreground">This Week</span>
            </div>
            <span className="text-xl font-bold text-primary">
              {stats.weeklySessionsCount} sessions
            </span>
          </div>

          {/* Study Streak */}
          <div className="p-3 bg-muted rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-orange-500" />
                <span className="font-medium text-muted-foreground">Study Streak</span>
              </div>
              <span className="text-xl font-bold text-orange-500">
                {stats.studyStreak} days
              </span>
            </div>
            {streakBadge && (
              <div className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full inline-block border">
                🏆 {streakBadge}
              </div>
            )}
          </div>

          {/* Weekly Goal */}
          <div className="p-3 bg-muted rounded-lg border">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-medium text-muted-foreground">Goal (sessions/week)</span>
            </div>
            
            <Select
              value={weeklyGoal.toString()}
              onValueChange={handleGoalChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full mb-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 sessions</SelectItem>
                <SelectItem value="20">20 sessions</SelectItem>
                <SelectItem value="30">30 sessions</SelectItem>
                <SelectItem value="40">40 sessions</SelectItem>
                <SelectItem value="50">50 sessions</SelectItem>
              </SelectContent>
            </Select>

            {/* Progress Display */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{stats.weeklyProgress}% complete</span>
                <span>{daysRemaining} days remaining</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(stats.weeklyProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStatsPanel;