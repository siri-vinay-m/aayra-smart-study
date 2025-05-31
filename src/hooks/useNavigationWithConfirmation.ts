
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionDiscard } from './useSessionDiscard';

export const useNavigationWithConfirmation = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const { discardCurrentSession } = useSessionDiscard();
  const navigate = useNavigate();

  const handleNavigationRequest = useCallback((path: string) => {
    setPendingNavigation(path);
    setShowDialog(true);
  }, []);

  const handleConfirmDiscard = useCallback(async () => {
    const success = await discardCurrentSession();
    if (success && pendingNavigation) {
      setShowDialog(false);
      setPendingNavigation(null);
      // Navigation is already handled in discardCurrentSession for home
      if (pendingNavigation !== '/home') {
        navigate(pendingNavigation);
      }
    }
  }, [discardCurrentSession, pendingNavigation, navigate]);

  const handleCancelDiscard = useCallback(() => {
    setShowDialog(false);
    setPendingNavigation(null);
  }, []);

  return {
    showDialog,
    handleNavigationRequest,
    handleConfirmDiscard,
    handleCancelDiscard,
  };
};
