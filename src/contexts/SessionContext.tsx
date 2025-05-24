
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface StudySession {
  id: string;
  subjectName: string;
  topicName: string;
  sessionName: string;
  sequenceNumber: number;
  status: 'focus_pending' | 'focus_inprogress' | 'upload_pending' | 'validating' | 'break_pending' | 'completed';
  isFavorite: boolean;
  focusDurationMinutes: number;
  breakDurationMinutes: number;
  createdAt: string;
  lastReviewedAt: string | null;
}

export interface PendingReview {
  id: string;
  sessionId: string;
  sessionName: string;
  dueDate: string;
  reviewStage: number;
  status: 'pending' | 'completed' | 'missed_rescheduled';
}

interface SessionContextType {
  currentSession: StudySession | null;
  setCurrentSession: React.Dispatch<React.SetStateAction<StudySession | null>>;
  completedSessions: StudySession[];
  setCompletedSessions: React.Dispatch<React.SetStateAction<StudySession[]>>;
  pendingReviews: PendingReview[];
  setPendingReviews: React.Dispatch<React.SetStateAction<PendingReview[]>>;
  completeSession: (sessionId: string) => void;
  loadCompletedSessions: () => Promise<void>;
  createNewSession: (subjectName: string, topicName: string, focusDuration: number, breakDuration: number) => Promise<StudySession | null>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [completedSessions, setCompletedSessions] = useState<StudySession[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const { user: authUser } = useAuth();

  const loadCompletedSessions = async () => {
    if (!authUser) return;

    try {
      const { data: sessions, error } = await supabase
        .from('StudySessions')
        .select('*')
        .eq('UserID', authUser.id)
        .eq('Status', 'completed')
        .order('CreatedAt', { ascending: false });

      if (error) {
        console.error('Error loading completed sessions:', error);
        return;
      }

      const formattedSessions: StudySession[] = sessions.map(session => ({
        id: session.SessionID,
        subjectName: session.SubjectName,
        topicName: session.TopicName,
        sessionName: session.SessionName,
        sequenceNumber: session.SequenceNumber,
        status: session.Status as StudySession['status'],
        isFavorite: session.IsFavorite,
        focusDurationMinutes: session.FocusDurationMinutes,
        breakDurationMinutes: session.BreakDurationMinutes,
        createdAt: session.CreatedAt,
        lastReviewedAt: session.LastReviewedAt
      }));

      setCompletedSessions(formattedSessions);
    } catch (error) {
      console.error('Error in loadCompletedSessions:', error);
    }
  };

  const createNewSession = async (subjectName: string, topicName: string, focusDuration: number, breakDuration: number): Promise<StudySession | null> => {
    if (!authUser) return null;

    try {
      // Get the next sequence number for this subject-topic combination
      const { data: existingSessions, error: countError } = await supabase
        .from('StudySessions')
        .select('SequenceNumber')
        .eq('UserID', authUser.id)
        .eq('SubjectName', subjectName)
        .eq('TopicName', topicName)
        .order('SequenceNumber', { ascending: false })
        .limit(1);

      if (countError) {
        console.error('Error getting sequence number:', countError);
        return null;
      }

      const nextSequence = existingSessions.length > 0 ? existingSessions[0].SequenceNumber + 1 : 1;
      const sessionName = `${subjectName} - ${topicName} #${nextSequence}`;

      const { data: newSession, error } = await supabase
        .from('StudySessions')
        .insert({
          UserID: authUser.id,
          SubjectName: subjectName,
          TopicName: topicName,
          SessionName: sessionName,
          SequenceNumber: nextSequence,
          Status: 'focus_pending',
          FocusDurationMinutes: focusDuration,
          BreakDurationMinutes: breakDuration
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      const formattedSession: StudySession = {
        id: newSession.SessionID,
        subjectName: newSession.SubjectName,
        topicName: newSession.TopicName,
        sessionName: newSession.SessionName,
        sequenceNumber: newSession.SequenceNumber,
        status: newSession.Status as StudySession['status'],
        isFavorite: newSession.IsFavorite,
        focusDurationMinutes: newSession.FocusDurationMinutes,
        breakDurationMinutes: newSession.BreakDurationMinutes,
        createdAt: newSession.CreatedAt,
        lastReviewedAt: newSession.LastReviewedAt
      };

      return formattedSession;
    } catch (error) {
      console.error('Error in createNewSession:', error);
      return null;
    }
  };

  const completeSession = async (sessionId: string) => {
    if (!authUser || !currentSession || currentSession.id !== sessionId) return;

    try {
      const { error } = await supabase
        .from('StudySessions')
        .update({ Status: 'completed' })
        .eq('SessionID', sessionId);

      if (error) {
        console.error('Error completing session:', error);
        return;
      }

      const completedSession = { ...currentSession, status: 'completed' as const };
      setCompletedSessions(prev => [...prev, completedSession]);
      setCurrentSession(null);
    } catch (error) {
      console.error('Error in completeSession:', error);
    }
  };

  useEffect(() => {
    if (authUser) {
      loadCompletedSessions();
    } else {
      setCompletedSessions([]);
      setCurrentSession(null);
      setPendingReviews([]);
    }
  }, [authUser]);

  return (
    <SessionContext.Provider 
      value={{
        currentSession,
        setCurrentSession,
        completedSessions,
        setCompletedSessions,
        pendingReviews,
        setPendingReviews,
        completeSession,
        loadCompletedSessions,
        createNewSession
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
