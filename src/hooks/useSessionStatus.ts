
import { supabase } from '@/integrations/supabase/client';
import { StudySession, SessionStatus } from '@/types/session';

export const useSessionStatus = () => {
  const updateCurrentSessionStatus = async (sessionId: string, status: SessionStatus): Promise<void> => {
    try {
      const { error } = await supabase
        .from('studysessions')
        .update({ status })
        .eq('sessionid', sessionId);

      if (error) {
        console.error('Error updating session status:', error);
        return;
      }
    } catch (error) {
      console.error('Error updating session status:', error);
    }
  };

  const markSessionAsIncomplete = async (sessionId: string, loadIncompleteSessions: () => Promise<void>): Promise<void> => {
    try {
      console.log('Marking session as incomplete in database:', sessionId);
      const { error } = await supabase
        .from('studysessions')
        .update({ status: 'incomplete' })
        .eq('sessionid', sessionId);

      if (error) {
        console.error('Error marking session as incomplete:', error);
        return;
      }

      console.log('Session marked as incomplete successfully');
      // Reload incomplete sessions to reflect the change
      await loadIncompleteSessions();
    } catch (error) {
      console.error('Error marking session as incomplete:', error);
    }
  };

  const toggleFavorite = async (sessionId: string, completedSessions: StudySession[], setCompletedSessions: React.Dispatch<React.SetStateAction<StudySession[]>>) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      // Find the current session to get its favorite status
      const sessionToUpdate = completedSessions.find(s => s.id === sessionId);
      if (!sessionToUpdate) return;

      const newFavoriteStatus = !sessionToUpdate.isFavorite;

      // Update in database
      const { error } = await supabase
        .from('studysessions')
        .update({ isfavorite: newFavoriteStatus })
        .eq('sessionid', sessionId)
        .eq('userid', authUser.user.id);

      if (error) {
        console.error('Error updating favorite status:', error);
        return;
      }

      // Update local state
      setCompletedSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === sessionId
            ? { ...session, isFavorite: newFavoriteStatus }
            : session
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return {
    updateCurrentSessionStatus,
    markSessionAsIncomplete,
    toggleFavorite,
  };
};
