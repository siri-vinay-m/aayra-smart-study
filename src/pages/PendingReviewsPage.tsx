
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { format } from 'date-fns';

const PendingReviewsPage = () => {
  const { pendingReviews, loadPendingReviews } = useSession();
  const navigate = useNavigate();
  
  // Reload pending reviews when the page loads and when returning from reviews
  useEffect(() => {
    console.log('PendingReviewsPage mounted, loading pending reviews...');
    loadPendingReviews();
  }, [loadPendingReviews]);

  // Also reload when the component becomes visible again (user returns from review)
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focused, reloading pending reviews...');
      loadPendingReviews();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, reloading pending reviews...');
        loadPendingReviews();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadPendingReviews]);
  
  const handleReviewClick = (sessionId: string) => {
    console.log('Starting review for session:', sessionId);
    navigate(`/review/${sessionId}`);
  };
  
  return (
    <MainLayout>
      <div className="px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Pending Reviews</h1>
        </div>
        
        {pendingReviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No pending reviews</p>
            <p className="text-sm text-gray-500 mt-2">
              Complete some study sessions to see reviews here!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingReviews.map((review) => (
              <div 
                key={`${review.sessionId}-${review.reviewStage}`}
                className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
                onClick={() => handleReviewClick(review.sessionId)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{review.sessionName}</h3>
                    <p className="text-sm text-gray-500">
                      {review.reviewStage}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Subject: {review.subjectName} • Topic: {review.topicName}
                    </p>
                  </div>
                  <div className="text-primary">
                    <span className="text-sm font-medium">
                      Due {format(new Date(review.dueDate), 'MMM d')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default PendingReviewsPage;
