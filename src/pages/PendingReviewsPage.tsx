
import React, { useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { useLoading } from '@/contexts/LoadingContext';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { PendingReview } from '@/types/session';

const PendingReviewsPage = () => {
  const { pendingReviews, loadPendingReviews } = useSession();
  const { withLoading } = useLoading();
  const navigate = useNavigate();
  
  // Optimized data loading with debouncing
  const debouncedLoadReviews = useCallback(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => loadPendingReviews(), { timeout: 100 });
    } else {
      setTimeout(loadPendingReviews, 0);
    }
  }, [loadPendingReviews]);

  // Load pending reviews when the page loads
  useEffect(() => {
    debouncedLoadReviews();
  }, [debouncedLoadReviews]);

  // Debug effect to log pending reviews changes
  useEffect(() => {
    console.log('PendingReviewsPage: pendingReviews changed:', pendingReviews.length, 'reviews');
    console.log('PendingReviewsPage: Full pendingReviews array:', pendingReviews);
    pendingReviews.forEach((review, index) => {
      console.log(`Review ${index + 1}:`, {
        id: review.id,
        sessionName: review.sessionName,
        reviewStage: review.reviewStage,
        dueDate: review.dueDate
      });
    });
  }, [pendingReviews]);



  // Optimized visibility change handling
  useEffect(() => {
    let timeoutId: number;
    
    const handleVisibilityChange = () => {
          if (!document.hidden) {
            // Debounce visibility changes to prevent excessive API calls
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              debouncedLoadReviews();
            }, 500);
          }
        };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(timeoutId);
    };
  }, [debouncedLoadReviews]);
  
  const handleReviewClick = useCallback(async (review: PendingReview) => {
    await withLoading(async () => {
      // Navigate to review session for this specific review entry (include entry id)
      navigate(`/review/${review.sessionId}?reviewEntryId=${review.id}`);
    }, 'Loading review session...');
  }, [navigate, withLoading]);

  // Memoize formatted reviews to prevent unnecessary re-renders
  const formattedReviews = useMemo(() => {
    return pendingReviews.map((review) => ({
      ...review,
      formattedDueDate: format(new Date(review.dueDate), 'MMM d'),
      key: `${review.sessionId}-${review.reviewStage}`
    }));
  }, [pendingReviews]);
  
  return (
    <MainLayout>
      <div className="px-4">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-foreground">Pending Reviews</h1>
          </div>
        </div>
        
        {formattedReviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No pending reviews</p>
        <p className="text-sm text-muted-foreground mt-2">
              Complete some study sessions to see reviews here!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {formattedReviews.map((review) => (
              <ReviewCard
                key={review.key}
                review={review}
                onReviewClick={handleReviewClick}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

// Memoized review card component for better performance
const ReviewCard = React.memo(({ review, onReviewClick }: {
  review: any;
  onReviewClick: (review: PendingReview) => void;
}) => (
  <div 
    className="bg-card shadow-sm rounded-lg p-4 border border-border cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
    onClick={() => onReviewClick(review)}
  >
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-medium text-foreground">{review.sessionName}</h3>
        <p className="text-sm text-muted-foreground">
          Stage {review.reviewStage}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Subject: {review.subjectName} • Topic: {review.topicName}
        </p>
      </div>
      <div className="text-primary">
        <span className="text-sm font-medium">
          Due {review.formattedDueDate}
        </span>
      </div>
    </div>
  </div>
));

export default PendingReviewsPage;
