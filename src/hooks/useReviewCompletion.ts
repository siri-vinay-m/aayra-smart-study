
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAIContentStorage } from '@/hooks/useAIContentStorage';
import { useQuizResponses } from '@/hooks/useQuizResponses';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import { AIGeneratedContent } from '@/types/session';

interface QuizResponse {
  questionIndex: number;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export const useReviewCompletion = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { storeAIContent } = useAIContentStorage();
  const { storeAllQuizResponses } = useQuizResponses();
  const { generateSessionPDF } = usePDFGeneration();

  const completeReviewSession = useCallback(async (
    sessionId: string,
    aiContent: AIGeneratedContent,
    quizResponses: QuizResponse[],
    reviewStage: number
  ) => {
    try {
      console.log('Starting review session completion:', { sessionId, reviewStage });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Store AI content with quiz results included
      const aiContentWithResults = {
        ...aiContent,
        quizResults: {
          responses: quizResponses,
          correctCount: quizResponses.filter(r => r.isCorrect).length,
          totalCount: quizResponses.length,
          scorePercentage: quizResponses.length > 0 ? Math.round((quizResponses.filter(r => r.isCorrect).length / quizResponses.length) * 100) : 0
        }
      };
      
      await storeAIContent(sessionId, aiContentWithResults, reviewStage);
      
      // Store quiz responses
      if (quizResponses.length > 0) {
        const formattedResponses = quizResponses.map(response => ({
          questionIndex: response.questionIndex,
          questionText: aiContent.quizQuestions[response.questionIndex]?.question || '',
          selectedAnswer: response.selectedAnswer,
          correctAnswer: response.correctAnswer,
          isCorrect: response.isCorrect
        }));
        await storeAllQuizResponses(sessionId, formattedResponses, reviewStage);
      }

      // Get session name for PDF generation
      const { data: sessionData } = await supabase
        .from('studysessions')
        .select('sessionname')
        .eq('sessionid', sessionId)
        .single();

      // Generate PDF for the session
      console.log('Generating PDF for review session...');
      await generateSessionPDF(sessionId, sessionData?.sessionname || 'Review Session', aiContentWithResults, reviewStage);

      // Update the review cycle entry status to completed
      console.log('Updating review cycle entry status...');
      const { error: reviewUpdateError } = await supabase
        .from('reviewcycleentries')
        .update({ 
          status: 'completed',
          updatedat: new Date().toISOString()
        })
        .eq('sessionid', sessionId)
        .eq('userid', user.id)
        .eq('reviewstage', reviewStage)
        .eq('status', 'pending');

      if (reviewUpdateError) {
        console.error('Error updating review cycle entry:', reviewUpdateError);
        throw reviewUpdateError;
      }

      // Update session last reviewed date
      const { error: sessionError } = await supabase
        .from('studysessions')
        .update({ 
          lastreviewedat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        })
        .eq('sessionid', sessionId);

      if (sessionError) {
        console.error('Error updating session last reviewed date:', sessionError);
      }

      console.log('Review session completed successfully');

      // Navigate to home page
      navigate('/home');
      
      toast({
        title: "Review Completed!",
        description: "Your review session has been completed and saved.",
      });
    } catch (error) {
      console.error('Error completing review session:', error);
      toast({
        title: "Error",
        description: "Failed to complete review session. Please try again.",
        variant: "destructive"
      });
      // Still navigate to home even if there's an error
      navigate('/home');
    }
  }, [navigate, toast, storeAIContent, storeAllQuizResponses, generateSessionPDF]);

  const completeNewSession = useCallback(async (
    sessionId: string,
    aiContent: AIGeneratedContent,
    quizResponses: QuizResponse[]
  ) => {
    try {
      console.log('Starting new session completion:', { sessionId });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Store AI content with quiz results for new session (review stage 0)
      const aiContentWithResults = {
        ...aiContent,
        quizResults: {
          responses: quizResponses,
          correctCount: quizResponses.filter(r => r.isCorrect).length,
          totalCount: quizResponses.length,
          scorePercentage: quizResponses.length > 0 ? Math.round((quizResponses.filter(r => r.isCorrect).length / quizResponses.length) * 100) : 0
        }
      };
      
      await storeAIContent(sessionId, aiContentWithResults, 0);
      
      // Store quiz responses
      if (quizResponses.length > 0) {
        const formattedResponses = quizResponses.map(response => ({
          questionIndex: response.questionIndex,
          questionText: aiContent.quizQuestions[response.questionIndex]?.question || '',
          selectedAnswer: response.selectedAnswer,
          correctAnswer: response.correctAnswer,
          isCorrect: response.isCorrect
        }));
        await storeAllQuizResponses(sessionId, formattedResponses, 0);
      }

      // Get session name for PDF generation
      const { data: sessionData } = await supabase
        .from('studysessions')
        .select('sessionname')
        .eq('sessionid', sessionId)
        .single();

      // Generate PDF for the session
      console.log('Generating PDF for new session...');
      await generateSessionPDF(sessionId, sessionData?.sessionname || 'Study Session', aiContentWithResults, 0);

      // Navigate to home page
      navigate('/home');
      
      toast({
        title: "Session Completed!",
        description: "Your study session has been completed and saved.",
      });
    } catch (error) {
      console.error('Error completing new session:', error);
      toast({
        title: "Error",
        description: "Failed to complete session. Please try again.",
        variant: "destructive"
      });
      // Still navigate to home even if there's an error
      navigate('/home');
    }
  }, [navigate, toast, storeAIContent, storeAllQuizResponses, generateSessionPDF]);

  return {
    completeReviewSession,
    completeNewSession
  };
};
