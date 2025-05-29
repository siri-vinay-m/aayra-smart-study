
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

export const useReviewCompletion = () => {
  const [isCompleting, setIsCompleting] = useState(false);
  const navigate = useNavigate();
  const { setPendingReviews } = useSession();

  const completeReview = async (reviewId: string, sessionId: string) => {
    setIsCompleting(true);
    try {
      // Call the database function to complete the review and generate next cycle
      const { error } = await supabase.rpc('complete_review_cycle', {
        entry_id: reviewId
      });

      if (error) {
        console.error('Error completing review:', error);
        throw error;
      }

      // Remove the completed review from pending reviews
      setPendingReviews(prevReviews => 
        prevReviews.filter(review => review.id !== reviewId)
      );

      console.log('Review completed successfully');
      navigate('/home');
    } catch (error) {
      console.error('Failed to complete review:', error);
      throw error;
    } finally {
      setIsCompleting(false);
    }
  };

  return {
    completeReview,
    isCompleting
  };
};
