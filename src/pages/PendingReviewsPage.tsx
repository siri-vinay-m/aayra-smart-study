
import React, { useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { useLoading } from '@/contexts/LoadingContext';
import { format } from 'date-fns';

const PendingReviewsPage = React.memo(() => {
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

  // Optimized visibility change handling
  useEffect(() => {
    let timeoutId: number;
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Debounce visibility changes to prevent excessive API calls
        clearTimeout(timeoutId);
        timeoutId = setTimeout(debouncedLoadReviews, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(timeoutId);
    };
  }, [debouncedLoadReviews]);
  
  const handleReviewClick = useCallback(async (sessionId: string) => {
    await withLoading(async () => {
      // Remove unnecessary delay for better performance
      navigate(`/review/${sessionId}`);
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
          <h1 className="text-2xl font-semibold text-foreground">Pending Reviews</h1>
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
});

// Memoized review card component for better performance
const ReviewCard = React.memo(({ review, onReviewClick }: {
  review: any;
  onReviewClick: (sessionId: string) => void;
}) => (
  <div 
    className="bg-card shadow-sm rounded-lg p-4 border border-border cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
    onClick={() => onReviewClick(review.sessionId)}
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
