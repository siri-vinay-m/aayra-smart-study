
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

  /**
   * Completes a review session by:
   * - Persisting AI content and quiz results
   * - Marking the corresponding review cycle entry as completed (by entry id when provided)
   * - Creating the next review cycle entry when applicable
   * - Refreshing pending reviews and navigating home
   */
  const completeReviewSession = useCallback(async (
    sessionId: string,
    aiContent: AIGeneratedContent,
    quizResponses: QuizResponse[],
    reviewStage: number,
    reviewEntryId?: string
  ) => {
    await withLoading(
      async () => {
        try {
          
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

          // Generate PDF for the review session (non-blocking)
          generateSessionPDF(sessionId, sessionData?.sessionname || 'Review Session', aiContentWithResults, reviewStage)
            .catch(pdfError => {
              console.error('PDF generation error:', pdfError);
            });

          // Get the current review entry to preserve the original initialappearancedate
          const query = supabase
            .from('reviewcycleentries')
            .select('*');

          let currentReview: any = null;
          let fetchError: any = null;
          let fetchMethod = '';

          if (reviewEntryId) {
            // Fetch by specific entry id if available (preferred method)
            const fetchById = await query
              .eq('entryid', reviewEntryId)
              .eq('userid', user.id)
              .single();
            currentReview = fetchById.data;
            fetchError = fetchById.error;
            fetchMethod = 'direct_id';
          } else {
            // Fallback to session + stage + pending filter
            const fetchByComposite = await query
              .eq('sessionid', sessionId)
              .eq('userid', user.id)
              .eq('reviewstage', reviewStage)
              .eq('status', 'pending')
              .single();
            currentReview = fetchByComposite.data;
            fetchError = fetchByComposite.error;
            fetchMethod = 'composite';
          }

          if (fetchError || !currentReview) {
            throw fetchError || new Error('Current review entry not found for completion');
          }

          // Update the review cycle entry status to completed
          const targetEntryId = reviewEntryId || currentReview.entryid;
          
          if (!targetEntryId) {
            throw new Error('Cannot update review entry: missing entry ID');
          }


          
          const updateResult = await supabase
            .from('reviewcycleentries')
            .update({ 
              status: 'completed',
              updatedat: new Date().toISOString()
            })
            .eq('entryid', targetEntryId)
            .eq('userid', user.id)
            .select('entryid, status, updatedat');

          if (updateResult.error) {
            console.error('Failed to update review entry status:', updateResult.error);
            

            
            throw updateResult.error;
          }
          
          // Verify the update was successful
          if (!updateResult.data || updateResult.data.length === 0) {
            throw new Error('Review entry update failed: no rows affected');
          }

          const updatedEntry = updateResult.data[0];
          if (updatedEntry.status !== 'completed') {
            throw new Error('Review entry status update verification failed');
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

          // Create next review cycle entry if needed
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
            }
          }

          // Add a longer delay to ensure database transaction is committed
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Refresh pending reviews list
          await loadPendingReviews();
          
          // Navigate directly to pending reviews page to see the updated list
          navigate('/pending-reviews');
        } catch (error) {
          console.error('Review completion failed:', error);
          throw error;
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
