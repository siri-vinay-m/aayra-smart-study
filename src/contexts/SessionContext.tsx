
import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface StudySession {
  id: string;
  subjectName: string;
  topicName: string;
  sessionName: string;
  sequenceNumber: number;
  status: 'focus_pending' | 'focus_inprogress' | 'upload_pending' | 'validating' | 'break_pending' | 'completed';
  isFavorite: boolean;
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
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  
  // Sample data for UI demonstration
  const [completedSessions, setCompletedSessions] = useState<StudySession[]>([
    {
      id: '1',
      subjectName: 'Mathematics',
      topicName: 'Calculus',
      sessionName: 'Mathematics - Calculus #1',
      sequenceNumber: 1,
      status: 'completed',
      isFavorite: true,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      lastReviewedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '2',
      subjectName: 'Physics',
      topicName: 'Mechanics',
      sessionName: 'Physics - Mechanics #1',
      sequenceNumber: 1,
      status: 'completed',
      isFavorite: false,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      lastReviewedAt: null
    }
  ]);

  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([
    {
      id: '1',
      sessionId: '1',
      sessionName: 'Mathematics - Calculus #1',
      dueDate: new Date().toISOString(),
      reviewStage: 1,
      status: 'pending'
    }
  ]);

  return (
    <SessionContext.Provider 
      value={{
        currentSession,
        setCurrentSession,
        completedSessions,
        setCompletedSessions,
        pendingReviews,
        setPendingReviews
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
