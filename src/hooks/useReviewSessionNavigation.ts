
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export type ReviewStep = 'flashcards' | 'quiz' | 'summary';

export const useReviewSessionNavigation = () => {
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleNavigationAttempt = (destination: string) => {
    setShowNavigationDialog(true);
    setPendingNavigation(destination);
  };

  const handleConfirmNavigation = () => {
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    setShowNavigationDialog(false);
    setPendingNavigation(null);
  };

  const handleCancelNavigation = () => {
    setShowNavigationDialog(false);
    setPendingNavigation(null);
  };

  return {
    showNavigationDialog,
    handleNavigationAttempt,
    handleConfirmNavigation,
    handleCancelNavigation,
  };
};
