
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QuizResponse {
  questionIndex: number;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface QuizResult {
  responses: QuizResponse[];
  correctCount: number;
  totalCount: number;
  score: number; // percentage
}

export const useQuizResponses = () => {
  const [isStoring, setIsStoring] = useState(false);

  const storeQuizResponse = async (
    sessionId: string,
    questionIndex: number,
    questionText: string,
    selectedAnswer: string,
    correctAnswer: string,
    reviewStage: number = 0
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const isCorrect = selectedAnswer === correctAnswer;

      const { error } = await supabase
        .from('user_quiz_responses')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          question_index: questionIndex,
          question_text: questionText,
          selected_answer: selectedAnswer,
          correct_answer: correctAnswer,
          is_correct: isCorrect,
          review_stage: reviewStage
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error storing quiz response:', error);
      return false;
    }
  };

  const storeAllQuizResponses = async (
    sessionId: string,
    responses: QuizResponse[],
    reviewStage: number = 0
  ): Promise<boolean> => {
    setIsStoring(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Clear existing responses for this session and review stage
      await supabase
        .from('user_quiz_responses')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .eq('review_stage', reviewStage);

      // Insert all responses
      const insertData = responses.map(response => ({
        session_id: sessionId,
        user_id: user.id,
        question_index: response.questionIndex,
        question_text: response.questionText,
        selected_answer: response.selectedAnswer,
        correct_answer: response.correctAnswer,
        is_correct: response.isCorrect,
        review_stage: reviewStage
      }));

      const { error } = await supabase
        .from('user_quiz_responses')
        .insert(insertData);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error storing quiz responses:', error);
      return false;
    } finally {
      setIsStoring(false);
    }
  };

  const getQuizResult = async (
    sessionId: string,
    reviewStage: number = 0
  ): Promise<QuizResult | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_quiz_responses')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .eq('review_stage', reviewStage)
        .order('question_index');

      if (error || !data) return null;

      const responses: QuizResponse[] = data.map(item => ({
        questionIndex: item.question_index,
        questionText: item.question_text,
        selectedAnswer: item.selected_answer,
        correctAnswer: item.correct_answer,
        isCorrect: item.is_correct
      }));

      const correctCount = responses.filter(r => r.isCorrect).length;
      const totalCount = responses.length;
      const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

      return {
        responses,
        correctCount,
        totalCount,
        score
      };
    } catch (error) {
      console.error('Error getting quiz result:', error);
      return null;
    }
  };

  return {
    storeQuizResponse,
    storeAllQuizResponses,
    getQuizResult,
    isStoring
  };
};
