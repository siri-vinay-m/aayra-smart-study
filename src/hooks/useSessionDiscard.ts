
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';

export const useSessionDiscard = () => {
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const { currentSession, setCurrentSession } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const isInValidationPhase = () => {
    return currentSession && currentSession.status === 'validating';
  };

  const isInBreakPhase = () => {
    return currentSession && currentSession.status === 'break_in_progress';
  };

  const handleNavigationAttempt = (destination: string) => {
    // For validation phase, show confirmation dialog with specific message
    if (currentSession && (currentSession.status === 'focus_in_progress' || currentSession.status === 'uploading')) {
      setShowDiscardDialog(true);
      setPendingNavigation(destination);
    } else if (isInValidationPhase()) {
      // Show confirmation dialog for validation phase with restart warning
      setShowDiscardDialog(true);
      setPendingNavigation(destination);
    } else if (isInBreakPhase()) {
      setShowDiscardDialog(true);
      setPendingNavigation(destination);
    } else {
      navigate(destination);
    }
  };

  const handleDiscardSession = async () => {
    if (currentSession) {
      try {
        console.log('Handling session discard:', currentSession.id, 'Status:', currentSession.status);
        
        if (isInValidationPhase()) {
          // For validation phase, determine where to go back based on session type
          let redirectPath = '/home';
          
          if (currentSession.status === 'completed') {
            redirectPath = '/completed-sessions';
          } else if (currentSession.reviewStage && currentSession.reviewStage > 0) {
            redirectPath = '/pending-reviews';
          } else {
            // For new/incomplete sessions, mark as incomplete
            const { error } = await supabase
              .from('studysessions')
              .update({ status: 'incomplete' })
              .eq('sessionid', currentSession.id);

            if (error) {
              console.error('Error marking session as incomplete:', error);
            } else {
              console.log('Session marked as incomplete successfully');
            }
            redirectPath = '/incomplete-sessions';
          }

          // Clear current session from context
          setCurrentSession(null);
          setShowDiscardDialog(false);
          setPendingNavigation(null);
          navigate(redirectPath);
          return;
        } else if (isInBreakPhase()) {
          // Mark session as completed for break phase
          const { error } = await supabase
            .from('studysessions')
            .update({ status: 'completed' })
            .eq('sessionid', currentSession.id);

          if (error) {
            console.error('Error marking session as completed:', error);
          } else {
            console.log('Session marked as completed successfully');
          }
        } else {
          // Delete the session completely for focus/upload phases
          const { error } = await supabase
            .from('studysessions')
            .delete()
            .eq('sessionid', currentSession.id);

          if (error) {
            console.error('Error deleting session:', error);
          } else {
            console.log('Session deleted successfully from database');
          }
        }

        // Clear current session from context
        setCurrentSession(null);
      } catch (error) {
        console.error('Error in handleDiscardSession:', error);
      }
    }

    setShowDiscardDialog(false);
    setPendingNavigation(null);
    navigate('/home');
  };

  const handleCancelDiscard = () => {
    setShowDiscardDialog(false);
    setPendingNavigation(null);
  };

  return {
    showDiscardDialog,
    isInValidationPhase: isInValidationPhase(),
    isInBreakPhase: isInBreakPhase(),
    handleNavigationAttempt,
    handleDiscardSession,
    handleCancelDiscard,
  };
};
