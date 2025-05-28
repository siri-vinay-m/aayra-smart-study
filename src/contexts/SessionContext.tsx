
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAI } from '@/hooks/useAI';

export type SessionStatus = 'focus_inprogress' | 'break_pending' | 'break_inprogress' | 'validating' | 'completed';

export interface AIGeneratedContent {
  flashcards: Array<{
    question: string;
    answer: string;
  }>;
  quizQuestions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
  summary: string;
}

export interface StudySession {
  id: string;
  sessionName: string;
  subjectName: string;
  topicName: string;
  focusDuration: number;
  breakDuration: number;
  focusDurationMinutes: number;
  breakDurationMinutes: number;
  status: SessionStatus;
  startTime: Date;
  completedAt?: Date;
  createdAt: Date;
  isFavorite?: boolean;
  aiGeneratedContent?: AIGeneratedContent;
}

export interface PendingReview {
  id: string;
  sessionId: string;
  sessionName: string;
  subjectName: string;
  topicName: string;
  completedAt: Date;
  dueDate: Date;
  reviewStage: string;
  aiGeneratedContent?: AIGeneratedContent;
}

interface SessionContextType {
  currentSession: StudySession | null;
  completedSessions: StudySession[];
  pendingReviews: PendingReview[];
  createNewSession: (subjectName: string, topicName: string, focusDuration: number, breakDuration: number) => Promise<StudySession | null>;
  setCurrentSession: (session: StudySession | null) => void;
  completeSession: (sessionId: string) => void;
  setPendingReviews: React.Dispatch<React.SetStateAction<PendingReview[]>>;
  setCompletedSessions: React.Dispatch<React.SetStateAction<StudySession[]>>;
  updateCurrentSessionStatus: (status: SessionStatus) => Promise<void>;
  loadCompletedSessions: () => Promise<void>;
  loadPendingReviews: () => Promise<void>;
  toggleFavorite: (sessionId: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [completedSessions, setCompletedSessions] = useState<StudySession[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const { processStudyMaterials } = useAI();

  // Load data on component mount
  useEffect(() => {
    loadCompletedSessions();
    loadPendingReviews();
  }, []);

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

  const loadPendingReviews = async () => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      // Load all completed sessions as pending reviews
      const { data: sessions, error } = await supabase
        .from('studysessions')
        .select('*')
        .eq('userid', authUser.user.id)
        .eq('status', 'completed')
        .order('createdat', { ascending: false });

      if (error) {
        console.error('Error loading pending reviews:', error);
        return;
      }

      if (sessions) {
        const formattedReviews: PendingReview[] = sessions.map(session => ({
          id: session.sessionid,
          sessionId: session.sessionid,
          sessionName: session.sessionname,
          subjectName: session.subjectname,
          topicName: session.topicname,
          completedAt: new Date(session.lastreviewedat || session.createdat),
          dueDate: new Date(session.lastreviewedat || session.createdat),
          reviewStage: 'Review Available',
        }));

        setPendingReviews(formattedReviews);
      }
    } catch (error) {
      console.error('Error in loadPendingReviews:', error);
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

      const sessionName = `${subjectName} - ${topicName}`;

      // Get the next sequence number
      const { data: lastSession } = await supabase
        .from('studysessions')
        .select('sequencenumber')
        .eq('userid', authUser.user.id)
        .order('sequencenumber', { ascending: false })
        .limit(1)
        .single();

      const nextSequenceNumber = (lastSession?.sequencenumber || 0) + 1;

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

  const completeSession = async (sessionId: string) => {
    if (currentSession && currentSession.id === sessionId) {
      try {
        const { data: authUser } = await supabase.auth.getUser();
        if (!authUser.user) return;

        // Update session status to completed
        const { error: sessionError } = await supabase
          .from('studysessions')
          .update({ 
            status: 'completed',
            lastreviewedat: new Date().toISOString()
          })
          .eq('sessionid', sessionId);

        if (sessionError) {
          console.error('Error completing session:', sessionError);
          return;
        }

        // Create review cycle entry for spaced repetition
        const { error: reviewError } = await supabase
          .from('reviewcycleentries')
          .insert({
            sessionid: sessionId,
            userid: authUser.user.id,
            initialappearancedate: new Date().toISOString().split('T')[0],
            currentreviewduedate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 24 hours from now
            reviewstage: 1,
            status: 'pending'
          });

        if (reviewError) {
          console.error('Error creating review cycle entry:', reviewError);
        }

        setCurrentSession(null);
        
        // Reload the data to reflect changes
        loadCompletedSessions();
        loadPendingReviews();
      } catch (error) {
        console.error('Error completing session:', error);
      }
    }
  };

  return (
    <SessionContext.Provider
      value={{
        currentSession,
        completedSessions,
        pendingReviews,
        createNewSession,
        setCurrentSession,
        completeSession,
        setPendingReviews,
        setCompletedSessions,
        updateCurrentSessionStatus,
        loadCompletedSessions,
        loadPendingReviews,
        toggleFavorite,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

// Export SessionContext for testing
export { SessionContext };
