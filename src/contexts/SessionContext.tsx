
import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  status: SessionStatus;
  startTime: Date;
  completedAt?: Date;
  aiGeneratedContent?: AIGeneratedContent;
}

export interface PendingReview {
  sessionId: string;
  sessionName: string;
  subjectName: string;
  topicName: string;
  completedAt: Date;
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
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [completedSessions, setCompletedSessions] = useState<StudySession[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);

  const createNewSession = async (
    subjectName: string,
    topicName: string,
    focusDuration: number,
    breakDuration: number
  ): Promise<StudySession | null> => {
    try {
      const sessionId = Date.now().toString();
      const sessionName = `${subjectName} - ${topicName}`;

      const newSession: StudySession = {
        id: sessionId,
        sessionName,
        subjectName,
        topicName,
        focusDuration,
        breakDuration,
        status: 'focus_inprogress',
        startTime: new Date(),
      };

      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  const completeSession = (sessionId: string) => {
    if (currentSession && currentSession.id === sessionId) {
      const completedSession = {
        ...currentSession,
        status: 'completed' as SessionStatus,
        completedAt: new Date(),
      };

      setCompletedSessions(prev => [...prev, completedSession]);

      const pendingReview: PendingReview = {
        sessionId: completedSession.id,
        sessionName: completedSession.sessionName,
        subjectName: completedSession.subjectName,
        topicName: completedSession.topicName,
        completedAt: completedSession.completedAt!,
        aiGeneratedContent: completedSession.aiGeneratedContent,
      };

      setPendingReviews(prev => [...prev, pendingReview]);
      setCurrentSession(null);
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
