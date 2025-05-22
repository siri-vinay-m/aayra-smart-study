
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { format } from 'date-fns';

const PendingReviewsPage = () => {
  const { pendingReviews } = useSession();
  const navigate = useNavigate();
  
  return (
    <MainLayout>
      <div className="px-4">
        <h1 className="text-2xl font-semibold mb-6">Pending Reviews</h1>
        
        {pendingReviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No pending reviews</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingReviews.map((review) => (
              <div 
                key={review.id}
                className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/review/${review.sessionId}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{review.sessionName}</h3>
                    <p className="text-sm text-gray-500">
                      Review stage: {review.reviewStage}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-primary">
                    Due {format(new Date(review.dueDate), 'MMM d')}
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
