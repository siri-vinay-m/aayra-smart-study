
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StudySession } from '@/types/session';

export const useSessionCreation = () => {
  const createNewSession = async (
    subjectName: string,
    topicName: string,
    focusDuration: number,
    breakDuration: number
  ): Promise<StudySession | null> => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) {
        console.error('No authenticated user found');
        return null;
      }

      // Get the next sequence number for this specific subject-topic combination
      const { data: lastSession } = await supabase
        .from('studysessions')
        .select('sequencenumber')
        .eq('userid', authUser.user.id)
        .eq('subjectname', subjectName)
        .eq('topicname', topicName)
        .order('sequencenumber', { ascending: false })
        .limit(1)
        .single();

      const nextSequenceNumber = (lastSession?.sequencenumber || 0) + 1;

      // Create session name with the new format: "Subject Name - Topic Name - Sequence Number"
      const sessionName = `${subjectName} - ${topicName} - ${nextSequenceNumber}`;

      const { data: session, error } = await supabase
        .from('studysessions')
        .insert({
          userid: authUser.user.id,
          sessionname: sessionName,
          subjectname: subjectName,
          topicname: topicName,
          focusdurationminutes: focusDuration,
          breakdurationminutes: breakDuration,
          status: 'focus_inprogress',
          sequencenumber: nextSequenceNumber,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      const newSession: StudySession = {
        id: session.sessionid,
        sessionName,
        subjectName,
        topicName,
        focusDuration: focusDuration * 60,
        breakDuration: breakDuration * 60,
        focusDurationMinutes: focusDuration,
        breakDurationMinutes: breakDuration,
        status: 'focus_inprogress',
        startTime: new Date(),
        createdAt: new Date(session.createdat),
        isFavorite: false,
      };

      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  return {
    createNewSession,
  };
};
