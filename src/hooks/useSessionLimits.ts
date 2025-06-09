
import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';

interface SessionLimits {
  canCreateSession: boolean;
  sessionsUsedToday: number;
  sessionsUsedThisWeek: number;
  dailyLimit: number | null;
  weeklyLimit: number | null;
  isLoading: boolean;
  error: string | null;
}

export const useSessionLimits = (): SessionLimits => {
  const { user } = useUser();
  const [sessionLimits, setSessionLimits] = useState<SessionLimits>({
    canCreateSession: true,
    sessionsUsedToday: 0,
    sessionsUsedThisWeek: 0,
    dailyLimit: null,
    weeklyLimit: null,
    isLoading: true,
    error: null,
  });

  const checkSessionLimits = async () => {
    if (!user?.id) {
      setSessionLimits(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setSessionLimits(prev => ({ ...prev, isLoading: true, error: null }));

      // Get user's subscription plan limits
      const dailyLimit = user.sessionsPerDay;
      const weeklyLimit = user.sessionsPerWeek;

      // Get today's session count from studysessions table
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const { data: todaySessions, error: todayError } = await supabase
        .from('studysessions')
        .select('sessionid')
        .eq('userid', user.id)
        .gte('createdat', today.toISOString())
        .lt('createdat', tomorrow.toISOString());

      console.log('useSessionLimits: Today sessions query result:', {
        data: todaySessions,
        error: todayError,
        userId: user.id,
        todayStart: today.toISOString(),
        tomorrowStart: tomorrow.toISOString()
      });

      const sessionsUsedToday = todaySessions?.length || 0;

      // Get this week's session count (Monday to Sunday)
      const startOfWeek = new Date();
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: weekSessions, error: weekError } = await supabase
        .from('studysessions')
        .select('sessionid')
        .eq('userid', user.id)
        .gte('createdat', startOfWeek.toISOString());

      console.log('useSessionLimits: Week sessions query result:', {
        data: weekSessions,
        error: weekError,
        userId: user.id,
        weekStart: startOfWeek.toISOString()
      });

      const sessionsUsedThisWeek = weekSessions?.length || 0;

      // Check if user can create a session
      let canCreateSession = true;

      if (dailyLimit !== null && sessionsUsedToday >= dailyLimit) {
        canCreateSession = false;
      }

      if (weeklyLimit !== null && sessionsUsedThisWeek >= weeklyLimit) {
        canCreateSession = false;
      }

      setSessionLimits({
        canCreateSession,
        sessionsUsedToday,
        sessionsUsedThisWeek,
        dailyLimit,
        weeklyLimit,
        isLoading: false,
        error: null,
      });

    } catch (error) {
      console.error('Error checking session limits:', error);
      setSessionLimits(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to check session limits',
      }));
    }
  };

  const incrementSessionCount = async () => {
    // Session count is now calculated dynamically from studysessions table
    // Just refresh the limits to get updated counts
    await checkSessionLimits();
  };

  useEffect(() => {
    checkSessionLimits();
  }, [user?.id, user?.sessionsPerDay, user?.sessionsPerWeek]);

  return {
    ...sessionLimits,
    incrementSessionCount,
  } as SessionLimits & { incrementSessionCount: () => Promise<void> };
};
