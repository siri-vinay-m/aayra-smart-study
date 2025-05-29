
import { useCallback } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';

export const useIncompleteSession = () => {
  const { currentSession, markSessionAsIncomplete } = useSession();
  const navigate = useNavigate();

  const handleBackButtonClick = useCallback(async () => {
    if (currentSession) {
      await markSessionAsIncomplete(currentSession.id);
      navigate('/home');
    }
  }, [currentSession, markSessionAsIncomplete, navigate]);

  return {
    handleBackButtonClick
  };
};
