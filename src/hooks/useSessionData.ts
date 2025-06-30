
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StudySession, SessionStatus } from '@/types/session';

export const useSessionData = () => {
  const [completedSessions, setCompletedSessions] = useState<StudySession[]>([]);
  const [incompleteSessions, setIncompleteSessions] = useState<StudySession[]>([]);
  
  // Cache timestamps to prevent unnecessary refetches
  const lastCompletedFetch = useRef<number>(0);
  const lastIncompleteFetch = useRef<number>(0);
  const CACHE_DURATION = 30000; // 30 seconds cache

  const loadCompletedSessions = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache validity
      const now = Date.now();
      if (!forceRefresh && (now - lastCompletedFetch.current) < CACHE_DURATION) {
        return; // Use cached data
      }

      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      const { data: sessions, error } = await supabase
        .from('studysessions')
        .select('sessionid, sessionname, subjectname, topicname, focusdurationminutes, breakdurationminutes, status, createdat, lastreviewedat, updatedat, isfavorite')
        .eq('userid', authUser.user.id)
        .eq('status', 'completed')
        .order('createdat', { ascending: false })
        .limit(50); // Limit initial load for performance

      if (error) {
        console.error('Error loading completed sessions:', error);
        return;
      }

      if (sessions) {
        // Use requestAnimationFrame for non-blocking processing
        requestAnimationFrame(() => {
          const formattedSessions: StudySession[] = sessions.map(session => ({
            id: session.sessionid,
            sessionName: session.sessionname,
            subjectName: session.subjectname,
            topicName: session.topicname,
            focusDuration: session.focusdurationminutes * 60,
            breakDuration: session.breakdurationminutes * 60,
            focusDurationMinutes: session.focusdurationminutes,
            breakDurationMinutes: session.breakdurationminutes,
            status: session.status as SessionStatus,
            startTime: new Date(session.createdat),
            completedAt: session.lastreviewedat ? new Date(session.lastreviewedat) : 
                        session.updatedat ? new Date(session.updatedat) : 
                        new Date(session.createdat),
            createdAt: new Date(session.createdat),
            isFavorite: session.isfavorite || false,
          }));

          setCompletedSessions(formattedSessions);
          lastCompletedFetch.current = now;
        });
      }
    } catch (error) {
      console.error('Error in loadCompletedSessions:', error);
    }
  }, []);

  const loadIncompleteSessions = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache validity
      const now = Date.now();
      if (!forceRefresh && (now - lastIncompleteFetch.current) < CACHE_DURATION) {
        return; // Use cached data
      }

      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      // Load sessions with both 'incomplete' and 'validating' status
      const { data: sessions, error } = await supabase
        .from('studysessions')
        .select('sessionid, sessionname, subjectname, topicname, focusdurationminutes, breakdurationminutes, status, createdat, isfavorite')
        .eq('userid', authUser.user.id)
        .in('status', ['incomplete', 'validating'])
        .order('createdat', { ascending: false })
        .limit(20); // Limit for performance

      if (error) {
        console.error('Error loading incomplete sessions:', error);
        return;
      }

      if (sessions) {
        // Use requestAnimationFrame for non-blocking processing
        requestAnimationFrame(() => {
          const formattedSessions: StudySession[] = sessions.map(session => ({
            id: session.sessionid,
            sessionName: session.sessionname,
            subjectName: session.subjectname,
            topicName: session.topicname,
            focusDuration: session.focusdurationminutes * 60,
            breakDuration: session.breakdurationminutes * 60,
            focusDurationMinutes: session.focusdurationminutes,
            breakDurationMinutes: session.breakdurationminutes,
            status: session.status as SessionStatus,
            startTime: new Date(session.createdat),
            createdAt: new Date(session.createdat),
            isFavorite: session.isfavorite || false,
          }));

          setIncompleteSessions(formattedSessions);
          lastIncompleteFetch.current = now;
        });
      }
    } catch (error) {
      console.error('Error in loadIncompleteSessions:', error);
    }
  }, []);

  return {
    completedSessions,
    incompleteSessions,
    setCompletedSessions,
    setIncompleteSessions,
    loadCompletedSessions,
    loadIncompleteSessions,
  };
};
