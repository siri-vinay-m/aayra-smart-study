
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAIContentStorage } from '@/hooks/useAIContentStorage';
import { useQuizResponses } from '@/hooks/useQuizResponses';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import { useSession } from '@/contexts/SessionContext';
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
  const { loadPendingReviews } = useSession();

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
      
      console.log('Storing AI content with review stage:', reviewStage);
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
        console.log('Storing quiz responses with review stage:', reviewStage);
        await storeAllQuizResponses(sessionId, formattedResponses, reviewStage);
      }

      // Get session name for PDF generation
      const { data: sessionData } = await supabase
        .from('studysessions')
        .select('sessionname')
        .eq('sessionid', sessionId)
        .single();

      // Generate PDF for the review session
      console.log('Generating PDF for review session with stage:', reviewStage);
      try {
        await generateSessionPDF(sessionId, sessionData?.sessionname || 'Review Session', aiContentWithResults, reviewStage);
        console.log('PDF generation completed successfully');
      } catch (pdfError) {
        console.error('PDF generation failed, but continuing with completion:', pdfError);
        // Don't fail the entire completion if PDF generation fails
      }

      // Update the review cycle entry status to completed
      console.log('Updating review cycle entry status to completed...');
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

      console.log('Review cycle entry updated successfully');

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

      // Create next review cycle entry if needed
      console.log('Creating next review cycle entry...');
      if (reviewStage < 6) { // Maximum stage is 6
        const nextReviewDate = calculateNextReviewDate(reviewStage);
        const { error: nextEntryError } = await supabase
          .from('reviewcycleentries')
          .insert({
            sessionid: sessionId,
            userid: user.id,
            initialappearancedate: new Date().toISOString().split('T')[0],
            currentreviewduedate: nextReviewDate,
            reviewstage: reviewStage + 1,
            status: 'pending'
          });

        if (nextEntryError) {
          console.error('Error creating next review cycle entry:', nextEntryError);
        } else {
          console.log('Next review cycle entry created for stage:', reviewStage + 1);
        }
      }

      console.log('Review session completed successfully');

      // Refresh pending reviews list
      console.log('Refreshing pending reviews list...');
      await loadPendingReviews();
      
      toast({
        title: "Review Completed!",
        description: "Your review session has been completed and saved.",
      });
      
      // Navigate to pending reviews to see updated list
      navigate('/pending-reviews');
    } catch (error) {
      console.error('Error completing review session:', error);
      toast({
        title: "Error",
        description: "Failed to complete review session. Please try again.",
        variant: "destructive"
      });
      // Still navigate back to pending reviews
      navigate('/pending-reviews');
    }
  }, [navigate, toast, storeAIContent, storeAllQuizResponses, generateSessionPDF, loadPendingReviews]);

  // Helper function to calculate next review date based on spaced repetition
  const calculateNextReviewDate = (currentStage: number): string => {
    const now = new Date();
    let daysToAdd = 1;
    
    switch (currentStage) {
      case 1: daysToAdd = 3; break;
      case 2: daysToAdd = 7; break;
      case 3: daysToAdd = 14; break;
      case 4: daysToAdd = 30; break;
      case 5: daysToAdd = 90; break;
      default: daysToAdd = 180; break;
    }
    
    now.setDate(now.getDate() + daysToAdd);
    return now.toISOString().split('T')[0];
  };

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

      // Generate PDF for the session (only for new sessions and incomplete sessions)
      console.log('Generating PDF for new/incomplete session...');
      try {
        await generateSessionPDF(sessionId, sessionData?.sessionname || 'Study Session', aiContentWithResults, 0);
        console.log('PDF generation completed successfully');
      } catch (pdfError) {
        console.error('PDF generation failed, but continuing with completion:', pdfError);
        // Don't fail the entire completion if PDF generation fails
      }

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
    }
  }, [toast, storeAIContent, storeAllQuizResponses, generateSessionPDF]);

  return {
    completeReviewSession,
    completeNewSession
  };
};
