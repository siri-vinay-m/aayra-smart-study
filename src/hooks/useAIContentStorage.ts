
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AIGeneratedContent } from '@/types/session';

export const useAIContentStorage = () => {
  const [isStoring, setIsStoring] = useState(false);

  const storeAIContent = async (
    sessionId: string,
    content: AIGeneratedContent,
    reviewStage: number = 0
  ): Promise<string | null> => {
    setIsStoring(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if content already exists for this session and review stage
      const { data: existingContent } = await supabase
        .from('session_ai_content')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .eq('reviewstage', reviewStage)
        .single();

      if (existingContent) {
        // Update existing content
        const { data, error } = await supabase
          .from('session_ai_content')
          .update({
            flashcards: content.flashcards,
            quiz_questions: content.quizQuestions,
            summary: content.summary,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingContent.id)
          .select()
          .single();

        if (error) throw error;
        return data.id;
      } else {
        // Insert new content
        const { data, error } = await supabase
          .from('session_ai_content')
          .insert({
            session_id: sessionId,
            user_id: user.id,
            flashcards: content.flashcards,
            quiz_questions: content.quizQuestions,
            summary: content.summary,
            reviewstage: reviewStage
          })
          .select()
          .single();

        if (error) throw error;
        return data.id;
      }
    } catch (error) {
      console.error('Error storing AI content:', error);
      return null;
    } finally {
      setIsStoring(false);
    }
  };

  const getAIContent = async (
    sessionId: string,
    reviewStage: number = 0
  ): Promise<AIGeneratedContent | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('session_ai_content')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .eq('reviewstage', reviewStage)
        .single();

      if (error || !data) return null;

      return {
        flashcards: data.flashcards || [],
        quizQuestions: data.quiz_questions || [],
        summary: data.summary || ''
      };
    } catch (error) {
      console.error('Error getting AI content:', error);
      return null;
    }
  };

  return {
    storeAIContent,
    getAIContent,
    isStoring
  };
};
