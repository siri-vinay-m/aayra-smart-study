
import { useState, useEffect } from 'react';
import { StudySession, SessionStatus } from '@/types/session';
import { useSessionCreation } from './useSessionCreation';
import { useSessionStatus } from './useSessionStatus';
import { useSessionData } from './useSessionData';

export const useSessionOperations = () => {
  const [currentSession, setCurrentSession] = useState<StudySession | null>(() => {
    // Initialize from localStorage if available
    const stored = localStorage.getItem('currentSession');
    return stored ? JSON.parse(stored) : null;
  });

  // Persist currentSession to localStorage whenever it changes
  useEffect(() => {
    if (currentSession) {
      localStorage.setItem('currentSession', JSON.stringify(currentSession));
    } else {
      localStorage.removeItem('currentSession');
    }
  }, [currentSession]);
  
  const { createNewSession } = useSessionCreation();
  const { updateCurrentSessionStatus: updateSessionStatus, markSessionAsIncomplete: markAsIncomplete, toggleFavorite: toggleSessionFavorite } = useSessionStatus();
  const { 
    completedSessions, 
    incompleteSessions, 
    setCompletedSessions, 
    setIncompleteSessions, 
    loadCompletedSessions, 
    loadIncompleteSessions 
  } = useSessionData();

  const updateCurrentSessionStatus = async (status: SessionStatus): Promise<void> => {
    if (currentSession) {
      await updateSessionStatus(currentSession.id, status);
      setCurrentSession(prev => prev ? { ...prev, status } : null);
    }
  };

  const markSessionAsIncomplete = async (sessionId: string): Promise<void> => {
    await markAsIncomplete(sessionId, loadIncompleteSessions);
  };

  const toggleFavorite = async (sessionId: string) => {
    await toggleSessionFavorite(sessionId, completedSessions, setCompletedSessions);
  };

  return {
    currentSession,
    completedSessions,
    incompleteSessions,
    setCurrentSession,
    setCompletedSessions,
    setIncompleteSessions,
    createNewSession,
    updateCurrentSessionStatus,
    markSessionAsIncomplete,
    loadCompletedSessions,
    loadIncompleteSessions,
    toggleFavorite,
  };
};
