import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StudySession, SessionStatus } from '@/types/session';

export const useSessionOperations = () => {
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [completedSessions, setCompletedSessions] = useState<StudySession[]>([]);

  const createNewSession = async (
    subjectName: string,
    topicName: string,
    focusDuration: number,
    breakDuration: number
  ): Promise<StudySession | null> => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) {
        console.error('No authenticated user found');
        return null;
      }

      // Get the next sequence number for this specific subject-topic combination
      const { data: lastSession } = await supabase
        .from('studysessions')
        .select('sequencenumber')
        .eq('userid', authUser.user.id)
        .eq('subjectname', subjectName)
        .eq('topicname', topicName)
        .order('sequencenumber', { ascending: false })
        .limit(1)
        .single();

      const nextSequenceNumber = (lastSession?.sequencenumber || 0) + 1;

      // Create session name with the new format: "Subject Name - Topic Name - Sequence Number"
      const sessionName = `${subjectName} - ${topicName} - ${nextSequenceNumber}`;

      const { data: session, error } = await supabase
        .from('studysessions')
        .insert({
          userid: authUser.user.id,
          sessionname: sessionName,
          subjectname: subjectName,
          topicname: topicName,
          focusdurationminutes: focusDuration,
          breakdurationminutes: breakDuration,
          status: 'focus_inprogress',
          sequencenumber: nextSequenceNumber,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      const newSession: StudySession = {
        id: session.sessionid,
        sessionName,
        subjectName,
        topicName,
        focusDuration: focusDuration * 60,
        breakDuration: breakDuration * 60,
        focusDurationMinutes: focusDuration,
        breakDurationMinutes: breakDuration,
        status: 'focus_inprogress',
        startTime: new Date(),
        createdAt: new Date(session.createdat),
        isFavorite: false,
      };

      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  const updateCurrentSessionStatus = async (status: SessionStatus): Promise<void> => {
    if (currentSession) {
      try {
        const { error } = await supabase
          .from('studysessions')
          .update({ status })
          .eq('sessionid', currentSession.id);

        if (error) {
          console.error('Error updating session status:', error);
          return;
        }

        setCurrentSession(prev => prev ? { ...prev, status } : null);
      } catch (error) {
        console.error('Error updating session status:', error);
      }
    }
  };

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
          completedAt: session.lastreviewedat ? new Date(session.lastreviewedat) : undefined,
          createdAt: new Date(session.createdat),
          isFavorite: session.isfavorite || false,
        }));

        setCompletedSessions(formattedSessions);
      }
    } catch (error) {
      console.error('Error in loadCompletedSessions:', error);
    }
  };

  const toggleFavorite = async (sessionId: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      // Find the current session to get its favorite status
      const sessionToUpdate = completedSessions.find(s => s.id === sessionId);
      if (!sessionToUpdate) return;

      const newFavoriteStatus = !sessionToUpdate.isFavorite;

      // Update in database
      const { error } = await supabase
        .from('studysessions')
        .update({ isfavorite: newFavoriteStatus })
        .eq('sessionid', sessionId)
        .eq('userid', authUser.user.id);

      if (error) {
        console.error('Error updating favorite status:', error);
        return;
      }

      // Update local state
      setCompletedSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === sessionId
            ? { ...session, isFavorite: newFavoriteStatus }
            : session
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return {
    currentSession,
    completedSessions,
    setCurrentSession,
    setCompletedSessions,
    createNewSession,
    updateCurrentSessionStatus,
    loadCompletedSessions,
    toggleFavorite,
  };
};
