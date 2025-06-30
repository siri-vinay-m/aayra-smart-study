
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useAIContentStorage } from './useAIContentStorage';
import { useQuizResponseStorage } from './useQuizResponseStorage';
import { usePDFGeneration } from './usePDFGeneration';
import { useLoadingPopup } from './useLoadingPopup';
import { AIGeneratedContent } from '@/types/session';

interface QuizResponse {
  questionIndex: number;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export const useReviewCompletion = () => {
  const navigate = useNavigate();
  const { storeAIContent } = useAIContentStorage();
  const { storeAllQuizResponses } = useQuizResponseStorage();
  const { generateSessionPDF } = usePDFGeneration();
  const { loadPendingReviews } = useSession();
  const { withLoading } = useLoadingPopup();

  const completeReviewSession = useCallback(async (
    sessionId: string,
    aiContent: AIGeneratedContent,
    quizResponses: QuizResponse[],
    reviewStage: number
  ) => {
    await withLoading(
      async () => {
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

          // Generate PDF for the review session (non-blocking)
          console.log('Starting PDF generation for review session with stage:', reviewStage);
          generateSessionPDF(sessionId, sessionData?.sessionname || 'Review Session', aiContentWithResults, reviewStage)
            .then(() => console.log('PDF generation completed successfully'))
            .catch(pdfError => console.error('PDF generation failed:', pdfError));

          // Get the current review entry to preserve the original initialappearancedate
          console.log('Fetching current review cycle entry...');
          const { data: currentReview, error: fetchError } = await supabase
            .from('reviewcycleentries')
            .select('*')
            .eq('sessionid', sessionId)
            .eq('userid', user.id)
            .eq('reviewstage', reviewStage)
            .eq('status', 'pending')
            .single();

          if (fetchError || !currentReview) {
            console.error('Error fetching current review entry:', fetchError);
            throw fetchError || new Error('Current review entry not found');
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
                initialappearancedate: currentReview.initialappearancedate, // Preserve original date
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

          // Add a small delay to ensure database transaction is committed
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Refresh pending reviews list
          console.log('Refreshing pending reviews list...');
          await loadPendingReviews();
          
          // Navigate to home for pending reviews (not pending reviews page)
          navigate('/home');
        } catch (error) {
          console.error('Error completing review session:', error);
          // Navigate to home on error too
          navigate('/home');
        }
      },
      'Completing review session...'
    );
  }, [navigate, storeAIContent, storeAllQuizResponses, generateSessionPDF, loadPendingReviews, withLoading]);

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
      console.log('Starting new session completion:', sessionId);
      
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

      // Store AI content and quiz responses
      console.log('Storing AI content and quiz responses...');
      await storeAIContent(sessionId, aiContentWithResults, 0);
      
      // Format quiz responses with question text for storage
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

      // Create the first review cycle entry (stage 1)
      const firstReviewDate = calculateNextReviewDate(0);
      console.log('Creating first review cycle for stage 1, due on:', firstReviewDate);
      
      const { error: insertError } = await supabase
        .from('reviewcycleentries')
        .insert({
          sessionid: sessionId,
          userid: user.id,
          initialappearancedate: new Date().toISOString().split('T')[0],
          currentreviewduedate: firstReviewDate,
          reviewstage: 1,
          status: 'pending'
        });

      if (insertError) {
        console.error('Error creating first review cycle:', insertError);
        // Don't throw here - the session was completed successfully
      } else {
        console.log('First review cycle entry created for stage 1');
      }

      // Get session data for PDF generation
      const { data: sessionData } = await supabase
        .from('studysessions')
        .select('sessionname')
        .eq('sessionid', sessionId)
        .single();

      // Generate PDF for the session (non-blocking, only for new sessions and incomplete sessions)
      console.log('Starting PDF generation for new/incomplete session...');
      generateSessionPDF(sessionId, sessionData?.sessionname || 'Study Session', aiContentWithResults, 0)
        .then(() => console.log('PDF generation completed successfully'))
        .catch(pdfError => console.error('PDF generation failed:', pdfError));

    } catch (error) {
      console.error('Error completing new session:', error);
    }
  }, [storeAIContent, storeAllQuizResponses, generateSessionPDF]);

  return {
    completeReviewSession,
    completeNewSession
  };
};
