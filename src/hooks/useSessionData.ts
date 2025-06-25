
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StudySession, SessionStatus } from '@/types/session';

export const useSessionData = () => {
  const [completedSessions, setCompletedSessions] = useState<StudySession[]>([]);
  const [incompleteSessions, setIncompleteSessions] = useState<StudySession[]>([]);

  const loadCompletedSessions = async () => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      const { data: sessions, error } = await supabase
        .from('studysessions')
        .select('*')
        .eq('userid', authUser.user.id)
        .eq('status', 'completed')
        .order('createdat', { ascending: false });

      if (error) {
        console.error('Error loading completed sessions:', error);
        return;
      }

      if (sessions) {
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
                      new Date(session.createdat), // Use updatedat or createdat as fallback
          createdAt: new Date(session.createdat),
          isFavorite: session.isfavorite || false,
        }));

        setCompletedSessions(formattedSessions);
      }
    } catch (error) {
      console.error('Error in loadCompletedSessions:', error);
    }
  };

  const loadIncompleteSessions = async () => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      // Loading incomplete sessions

      // Load sessions with both 'incomplete' and 'validating' status
      const { data: sessions, error } = await supabase
        .from('studysessions')
        .select('*')
        .eq('userid', authUser.user.id)
        .in('status', ['incomplete', 'validating'])
        .order('createdat', { ascending: false });

      if (error) {
        console.error('Error loading incomplete sessions:', error);
        return;
      }

      if (sessions) {
        console.log('Found incomplete/validating sessions:', sessions.length);
        sessions.forEach(session => {
          console.log('Incomplete session:', {
            id: session.sessionid,
            name: session.sessionname,
            status: session.status,
            createdAt: session.createdat
          });
        });
        
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
      }
    } catch (error) {
      console.error('Error in loadIncompleteSessions:', error);
    }
  };

  return {
    completedSessions,
    incompleteSessions,
    setCompletedSessions,
    setIncompleteSessions,
    loadCompletedSessions,
    loadIncompleteSessions,
  };
};
