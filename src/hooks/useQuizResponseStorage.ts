import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QuizResponse {
  questionIndex: number;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

/**
 * Hook for storing quiz responses in the database
 * Handles the storage of quiz responses for review sessions
 */
export const useQuizResponseStorage = () => {
  /**
   * Store all quiz responses for a session
   * @param sessionId - The session ID
   * @param responses - Array of quiz responses
   * @param reviewStage - The review stage number
   */
  const storeAllQuizResponses = useCallback(async (
    sessionId: string,
    responses: QuizResponse[],
    reviewStage: number
  ) => {
    try {
      console.log('Storing quiz responses:', { sessionId, responseCount: responses.length, reviewStage });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Prepare quiz responses for insertion
      const quizResponsesData = responses.map(response => ({
        session_id: sessionId,
        user_id: user.id,
        question_index: response.questionIndex,
        question_text: response.questionText,
        selected_answer: response.selectedAnswer,
        correct_answer: response.correctAnswer,
        is_correct: response.isCorrect,
        review_stage: reviewStage,
        created_at: new Date().toISOString()
      }));

      // Insert quiz responses
      const { error: quizError } = await supabase
        .from('user_quiz_responses')
        .insert(quizResponsesData);

      if (quizError) {
        console.error('Error storing quiz responses:', quizError);
        throw quizError;
      }
    } catch (error) {
      console.error('Error in storeAllQuizResponses:', error);
      throw error;
    }
  }, []);

  return {
    storeAllQuizResponses
  };
};