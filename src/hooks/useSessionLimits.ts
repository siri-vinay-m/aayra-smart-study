
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

      // Get today's session count
      const today = new Date().toISOString().split('T')[0];
      const { data: todayUsage } = await supabase
        .from('user_session_usage')
        .select('sessions_count')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      const sessionsUsedToday = todayUsage?.sessions_count || 0;

      // Get this week's session count (Monday to Sunday)
      const startOfWeek = new Date();
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: weekUsage } = await supabase
        .from('user_session_usage')
        .select('sessions_count')
        .eq('user_id', user.id)
        .gte('date', startOfWeek.toISOString().split('T')[0]);

      const sessionsUsedThisWeek = weekUsage?.reduce((sum, day) => sum + (day.sessions_count || 0), 0) || 0;

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
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Upsert today's session count
      const { error } = await supabase
        .from('user_session_usage')
        .upsert({
          user_id: user.id,
          date: today,
          sessions_count: sessionLimits.sessionsUsedToday + 1,
        }, {
          onConflict: 'user_id,date',
        });

      if (error) {
        console.error('Error incrementing session count:', error);
        return;
      }

      // Refresh limits after incrementing
      await checkSessionLimits();

    } catch (error) {
      console.error('Error incrementing session count:', error);
    }
  };

  useEffect(() => {
    checkSessionLimits();
  }, [user?.id, user?.sessionsPerDay, user?.sessionsPerWeek]);

  return {
    ...sessionLimits,
    incrementSessionCount,
  } as SessionLimits & { incrementSessionCount: () => Promise<void> };
};
