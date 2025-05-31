
import { supabase } from '@/integrations/supabase/client';
import { StudySession } from '@/types/session';

export const useSessionCreation = () => {
  const createNewSession = async (
    subjectName: string,
    topicName: string,
    focusDurationMinutes: number,
    breakDurationMinutes: number
  ): Promise<StudySession | null> => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) {
        console.error('No authenticated user found');
        return null;
      }

      // Get the next sequence number for the user
      const { data: existingSessions, error: countError } = await supabase
        .from('studysessions')
        .select('sequencenumber')
        .eq('userid', authUser.user.id)
        .order('sequencenumber', { ascending: false })
        .limit(1);

      if (countError) {
        console.error('Error getting session count:', countError);
        return null;
      }

      const nextSequenceNumber = existingSessions && existingSessions.length > 0 
        ? existingSessions[0].sequencenumber + 1 
        : 1;

      const sessionName = `${subjectName} - ${topicName} #${nextSequenceNumber}`;

      const newSession = {
        sessionname: sessionName,
        subjectname: subjectName,
        topicname: topicName,
        focusdurationminutes: focusDurationMinutes,
        breakdurationminutes: breakDurationMinutes,
        status: 'focus_in_progress' as const,
        userid: authUser.user.id,
        sequencenumber: nextSequenceNumber,
      };

      const { data, error } = await supabase
        .from('studysessions')
        .insert(newSession)
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      const createdSession: StudySession = {
        id: data.sessionid,
        sessionName: data.sessionname,
        subjectName: data.subjectname,
        topicName: data.topicname,
        focusDuration: data.focusdurationminutes * 60,
        breakDuration: data.breakdurationminutes * 60,
        focusDurationMinutes: data.focusdurationminutes,
        breakDurationMinutes: data.breakdurationminutes,
        status: data.status as 'focus_in_progress',
        startTime: new Date(data.createdat),
        createdAt: new Date(data.createdat),
        isFavorite: data.isfavorite,
      };

      console.log('Session created successfully:', createdSession);
      return createdSession;
    } catch (error) {
      console.error('Error in createNewSession:', error);
      return null;
    }
  };

  return {
    createNewSession,
  };
};
