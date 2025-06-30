
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudySession } from '@/types/session';
import { useSession } from '@/contexts/SessionContext';
import { useSessionAI } from './useSessionAI';
import { useLoadingPopup } from './useLoadingPopup';

export const useIncompleteSession = (session: StudySession | null) => {
  const navigate = useNavigate();
  const { setCurrentSession, updateCurrentSessionStatus } = useSession();
  const { generateAIContentForSession } = useSessionAI();
  const { withLoading } = useLoadingPopup();

  useEffect(() => {
    const setupIncompleteSession = async () => {
      if (!session) return;

      await withLoading(
        async () => {
          console.log('Setting up incomplete session:', session.id);
          
          try {
            // Generate AI content for the session using uploaded materials
            console.log('Generating AI content for incomplete session:', session.sessionName);
            const aiContent = await generateAIContentForSession(session.id, session.sessionName, 0);
            
            if (aiContent) {
              console.log('AI content generated successfully for incomplete session');
              
              // Update the session with AI content and set status to validating
              const updatedSession: StudySession = {
                ...session,
                status: 'validating',
                aiGeneratedContent: aiContent
              };
              
              // Update session status in database
              await updateCurrentSessionStatus('validating');
              
              // Set as current session
              setCurrentSession(updatedSession);
              
              // Navigate to validation page
              navigate('/validation');
            } else {
              console.log('Failed to generate AI content for incomplete session');
              // Still navigate to validation with fallback content
              const updatedSession: StudySession = {
                ...session,
                status: 'validating'
              };
              
              await updateCurrentSessionStatus('validating');
              setCurrentSession(updatedSession);
              navigate('/validation');
            }
          } catch (error) {
            console.error('Error setting up incomplete session:', error);
            // Fallback - still navigate to validation
            const updatedSession: StudySession = {
              ...session,
              status: 'validating'
            };
            
            await updateCurrentSessionStatus('validating');
            setCurrentSession(updatedSession);
            navigate('/validation');
          }
        },
        'Setting up session...'
      );
    };

    setupIncompleteSession();
  }, [session, setCurrentSession, updateCurrentSessionStatus, navigate, generateAIContentForSession]);
};
