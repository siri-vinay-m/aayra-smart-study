
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
    if (currentSession && (currentSession.status === 'focus_in_progress' || currentSession.status === 'uploading')) {
      setShowDiscardDialog(true);
      setPendingNavigation(destination);
    } else {
      navigate(destination);
    }
  };

  const handleDiscardSession = async () => {
    if (currentSession) {
      try {
        console.log('Discarding session:', currentSession.id);
        
        // Delete the session from the database completely
        const { error } = await supabase
          .from('studysessions')
          .delete()
          .eq('sessionid', currentSession.id);

        if (error) {
          console.error('Error deleting session:', error);
        } else {
          console.log('Session deleted successfully from database');
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

  return {
    showDiscardDialog,
    handleNavigationAttempt,
    handleDiscardSession,
    handleCancelDiscard,
  };
};
