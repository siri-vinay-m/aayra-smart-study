
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
    if (currentSession && (currentSession.status === 'focus_pending' || currentSession.status === 'upload_pending')) {
      setShowDiscardDialog(true);
      setPendingNavigation(destination);
    } else {
      navigate(destination);
    }
  };

  const handleDiscardSession = async () => {
    if (currentSession) {
      try {
        // Delete the session from the database
        const { error } = await supabase
          .from('studysessions')
          .delete()
          .eq('sessionid', currentSession.id);

        if (error) {
          console.error('Error deleting session:', error);
        }

        // Clear current session from context
        setCurrentSession(null);
      } catch (error) {
        console.error('Error in handleDiscardSession:', error);
      }
    }

    setShowDiscardDialog(false);
    
    // Navigate to the pending destination or home by default
    const destination = pendingNavigation || '/home';
    setPendingNavigation(null);
    navigate(destination);
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
