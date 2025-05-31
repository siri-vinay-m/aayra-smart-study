
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';

export const useSessionDiscard = () => {
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const { currentSession, setCurrentSession } = useSession();
  const navigate = useNavigate();

  const handleNavigationAttempt = (destination: string) => {
    if (currentSession) {
      // Show discard dialog for focus_in_progress, uploading, or validating sessions
      if (currentSession.status === 'focus_in_progress' || 
          currentSession.status === 'uploading' || 
          currentSession.status === 'validating') {
        setShowDiscardDialog(true);
        setPendingNavigation(destination);
      } else {
        navigate(destination);
      }
    } else {
      navigate(destination);
    }
  };

  const handleDiscardSession = async () => {
    if (currentSession) {
      try {
        console.log('Handling session discard:', currentSession.id, 'Status:', currentSession.status);
        
        if (currentSession.status === 'validating') {
          // Mark session as incomplete for validation phase
          console.log('Marking session as incomplete:', currentSession.id);
          const { error } = await supabase
            .from('studysessions')
            .update({ status: 'incomplete' })
            .eq('sessionid', currentSession.id);

          if (error) {
            console.error('Error marking session as incomplete:', error);
          } else {
            console.log('Session marked as incomplete successfully');
          }
        } else {
          // Delete the session completely for focus_in_progress or uploading phases
          console.log('Deleting session:', currentSession.id);
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
    
    // Always navigate to home when discarding a session
    setPendingNavigation(null);
    navigate('/home');
  };

  const handleCancelDiscard = () => {
    setShowDiscardDialog(false);
    setPendingNavigation(null);
  };

  // Get appropriate dialog message based on session status
  const getDialogMessage = () => {
    if (currentSession?.status === 'validating') {
      return "Do you want to exit the session? Session will be marked incomplete.";
    }
    return "The session will be discarded. This action cannot be undone.";
  };

  return {
    showDiscardDialog,
    handleNavigationAttempt,
    handleDiscardSession,
    handleCancelDiscard,
    getDialogMessage,
  };
};
