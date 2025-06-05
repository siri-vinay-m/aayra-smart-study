
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AIGeneratedContent } from '@/types/session';

export const usePDFGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSessionPDF = async (
    sessionId: string,
    sessionName: string,
    aiContent: AIGeneratedContent,
    reviewStage: number = 0
  ): Promise<string | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Generating PDF for session:', sessionId, 'review stage:', reviewStage);
      console.log('AI Content being sent:', {
        hasFlashcards: !!aiContent.flashcards,
        flashcardsCount: aiContent.flashcards?.length || 0,
        hasQuizQuestions: !!aiContent.quizQuestions,
        quizQuestionsCount: aiContent.quizQuestions?.length || 0,
        hasSummary: !!aiContent.summary,
        summaryLength: aiContent.summary?.length || 0,
        hasQuizResults: !!(aiContent as any).quizResults
      });

      const response = await fetch(
        'https://ouyilgvqbwcekkajrrug.supabase.co/functions/v1/generate-session-pdf',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91eWlsZ3ZxYndjZWtrYWpycnVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NzU4MzgsImV4cCI6MjA2MzU1MTgzOH0.HPv36VVU0WpAXidt2ZrjzUSuiNPCMaXk2tI8SryitbE`,
          },
          body: JSON.stringify({
            sessionId,
            sessionName,
            aiContent,
            userId: user.id,
            reviewStage
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('PDF generation failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.error || `Failed to generate PDF (${response.status})`);
      }

      const result = await response.json();
      console.log('PDF generated successfully:', result.pdfId);
      
      return result.pdfId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
      setError(errorMessage);
      console.error('Error generating PDF:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const updateExistingSessionsPDFs = async (): Promise<void> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get all completed sessions that don't have PDFs yet
      const { data: sessions, error: sessionsError } = await supabase
        .from('studysessions')
        .select('sessionid, sessionname, subjectname, topicname')
        .eq('userid', user.id)
        .eq('status', 'completed')
        .not('sessionid', 'in', `(
          SELECT session_id FROM session_pdfs WHERE user_id = '${user.id}' AND reviewstage = 0
        )`);

      if (sessionsError) {
        throw new Error('Failed to fetch sessions');
      }

      console.log('Found sessions without PDFs:', sessions?.length || 0);

      // Process each session
      for (const session of sessions || []) {
        try {
          // Try to fetch AI content for this session (this might not exist for older sessions)
          const { data: materials } = await supabase
            .from('uploadedmaterials')
            .select('*')
            .eq('sessionid', session.sessionid);

          // Create basic fallback content for sessions without AI content
          const fallbackContent: AIGeneratedContent = {
            flashcards: [
              {
                question: `What was studied in the "${session.sessionname}" session?`,
                answer: `This session covered ${session.subjectname} - ${session.topicname}. Review your study materials to reinforce the key concepts.`
              }
            ],
            quizQuestions: [
              {
                question: `What was the main topic of the "${session.sessionname}" session?`,
                options: [session.topicname, "Other topic", "No specific topic", "Multiple topics"],
                correctAnswer: session.topicname,
                explanation: `This session focused on ${session.topicname} in ${session.subjectname}.`
              }
            ],
            summary: `This study session on "${session.sessionname}" covered ${session.subjectname} - ${session.topicname}. ${materials?.length ? `Materials were uploaded for this session.` : 'Continue studying this topic to reinforce your learning.'}`
          };

          await generateSessionPDF(session.sessionid, session.sessionname, fallbackContent, 0);
          
          // Add a small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (sessionError) {
          console.error(`Failed to generate PDF for session ${session.sessionid}:`, sessionError);
          // Continue with next session
        }
      }

      console.log('Finished updating existing sessions with PDFs');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update existing sessions';
      setError(errorMessage);
      console.error('Error updating existing sessions:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateSessionPDF,
    updateExistingSessionsPDFs,
    isGenerating,
    error
  };
};
