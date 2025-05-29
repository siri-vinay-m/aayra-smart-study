
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSessionOperations } from '@/hooks/useSessionOperations';
import { useReviewOperations } from '@/hooks/useReviewOperations';
import { StudySession, PendingReview, SessionStatus, AIGeneratedContent } from '@/types/session';

// Re-export types for backward compatibility
export type { StudySession, PendingReview, SessionStatus, AIGeneratedContent };

interface SessionContextType {
  currentSession: StudySession | null;
  completedSessions: StudySession[];
  incompleteSessions: StudySession[];
  pendingReviews: PendingReview[];
  createNewSession: (subjectName: string, topicName: string, focusDuration: number, breakDuration: number) => Promise<StudySession | null>;
  setCurrentSession: (session: StudySession | null) => void;
  completeSession: (sessionId: string) => void;
  setPendingReviews: React.Dispatch<React.SetStateAction<PendingReview[]>>;
  setCompletedSessions: React.Dispatch<React.SetStateAction<StudySession[]>>;
  setIncompleteSessions: React.Dispatch<React.SetStateAction<StudySession[]>>;
  updateCurrentSessionStatus: (status: SessionStatus) => Promise<void>;
  markSessionAsIncomplete: (sessionId: string) => Promise<void>;
  loadCompletedSessions: () => Promise<void>;
  loadIncompleteSessions: () => Promise<void>;
  loadPendingReviews: () => Promise<void>;
  toggleFavorite: (sessionId: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const sessionOps = useSessionOperations();
  const reviewOps = useReviewOperations();

  // Load data on component mount
  useEffect(() => {
    sessionOps.loadCompletedSessions();
    sessionOps.loadIncompleteSessions();
    reviewOps.loadPendingReviews();
  }, []);

  const completeSession = (sessionId: string) => {
    if (sessionOps.currentSession && sessionOps.currentSession.id === sessionId) {
      reviewOps.completeSession(sessionId, sessionOps.loadCompletedSessions);
      sessionOps.setCurrentSession(null);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        currentSession: sessionOps.currentSession,
        completedSessions: sessionOps.completedSessions,
        incompleteSessions: sessionOps.incompleteSessions,
        pendingReviews: reviewOps.pendingReviews,
        createNewSession: sessionOps.createNewSession,
        setCurrentSession: sessionOps.setCurrentSession,
        completeSession,
        setPendingReviews: reviewOps.setPendingReviews,
        setCompletedSessions: sessionOps.setCompletedSessions,
        setIncompleteSessions: sessionOps.setIncompleteSessions,
        updateCurrentSessionStatus: sessionOps.updateCurrentSessionStatus,
        markSessionAsIncomplete: sessionOps.markSessionAsIncomplete,
        loadCompletedSessions: sessionOps.loadCompletedSessions,
        loadIncompleteSessions: sessionOps.loadIncompleteSessions,
        loadPendingReviews: reviewOps.loadPendingReviews,
        toggleFavorite: sessionOps.toggleFavorite,
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
