
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';

export const useSessionDiscard = () => {
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const { currentSession, setCurrentSession, loadIncompleteSessions } = useSession();
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
          // For validation phase, determine action based on session origin
          if (currentSession.reviewStage && currentSession.reviewStage > 0) {
            // This is a pending review session - navigate back to pending reviews
            setCurrentSession(null);
            setShowDiscardDialog(false);
            setPendingNavigation(null);
            navigate('/pending-reviews');
            return;
          } else if (currentSession.status === 'completed') {
            // This is a completed session review - navigate back to completed sessions
            setCurrentSession(null);
            setShowDiscardDialog(false);
            setPendingNavigation(null);
            navigate('/completed-sessions');
            return;
          } else {
            // This is a new session or incomplete session - mark as incomplete and go to home
            const { error } = await supabase
              .from('studysessions')
              .update({ status: 'incomplete' })
              .eq('sessionid', currentSession.id);

            if (error) {
              console.error('Error marking session as incomplete:', error);
            } else {
              console.log('Session marked as incomplete successfully');
              // Add a small delay to ensure database transaction is committed
              await new Promise(resolve => setTimeout(resolve, 500));
              // Reload incomplete sessions to reflect the change
              await loadIncompleteSessions();
            }
            
            setCurrentSession(null);
            setShowDiscardDialog(false);
            setPendingNavigation(null);
            navigate('/home'); // Always go to home for new/incomplete sessions
            return;
          }
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
