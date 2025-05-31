
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useToast } from '@/hooks/use-toast';

export const useSessionDiscard = () => {
  const { currentSession, setCurrentSession } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();

  const deleteSessionFromDatabase = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('studysessions')
        .delete()
        .eq('sessionid', sessionId);

      if (error) {
        console.error('Error deleting session:', error);
        toast({
          title: "Error",
          description: "Failed to delete session from database.",
          variant: "destructive"
        });
        return false;
      }

      console.log('Session deleted successfully from database');
      return true;
    } catch (error) {
      console.error('Error in deleteSessionFromDatabase:', error);
      toast({
        title: "Error",
        description: "Failed to delete session from database.",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  const discardCurrentSession = useCallback(async () => {
    if (!currentSession) {
      console.warn('No current session to discard');
      return true;
    }

    const success = await deleteSessionFromDatabase(currentSession.id);
    if (success) {
      setCurrentSession(null);
      navigate('/home');
      toast({
        title: "Session Discarded",
        description: "The session has been discarded successfully.",
      });
    }
    return success;
  }, [currentSession, deleteSessionFromDatabase, setCurrentSession, navigate, toast]);

  return {
    discardCurrentSession,
    deleteSessionFromDatabase,
  };
};
