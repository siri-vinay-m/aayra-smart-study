
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
  const { generatePDFForSession } = usePDFGeneration();

  const completeReviewSession = useCallback(async (
    sessionId: string,
    aiContent: AIGeneratedContent,
    quizResponses: QuizResponse[],
    reviewStage: number
  ) => {
    try {
      // Store AI content
      await storeAIContent(sessionId, aiContent, reviewStage);
      
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

      // Generate PDF for the session
      await generatePDFForSession(sessionId);

      // Mark the review cycle entry as completed
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('reviewcycleentries')
          .update({ status: 'completed' })
          .eq('sessionid', sessionId)
          .eq('userid', user.id)
          .eq('status', 'pending');

        if (error) {
          console.error('Error updating review cycle entry:', error);
        }
      }

      // Navigate to home page instead of pending reviews
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
  }, [navigate, toast, storeAIContent, storeAllQuizResponses, generatePDFForSession]);

  const completeNewSession = useCallback(async (
    sessionId: string,
    aiContent: AIGeneratedContent,
    quizResponses: QuizResponse[]
  ) => {
    try {
      // Store AI content for new session (review stage 0)
      await storeAIContent(sessionId, aiContent, 0);
      
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

      // Generate PDF for the session
      await generatePDFForSession(sessionId);

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
  }, [navigate, toast, storeAIContent, storeAllQuizResponses, generatePDFForSession]);

  return {
    completeReviewSession,
    completeNewSession
  };
};
