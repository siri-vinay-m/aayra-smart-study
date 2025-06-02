
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useReviewCompletion } from '@/hooks/useReviewCompletion';
import { useSession } from '@/contexts/SessionContext';

interface SummaryViewProps {
  summary: string;
  onFinish: () => void;
  isReviewSession?: boolean;
  reviewId?: string;
  sessionId?: string;
}

const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  onFinish,
  isReviewSession = false,
  reviewId,
  sessionId
}) => {
  const { completeReview, isCompleting } = useReviewCompletion();
  const { completeSession, currentSession } = useSession();

  const handleFinish = async () => {
    if (isReviewSession && reviewId && sessionId) {
      try {
        await completeReview(reviewId, sessionId);
      } catch (error) {
        console.error('Failed to complete review:', error);
        // Still call onFinish as fallback
        onFinish();
      }
    } else if (currentSession && (currentSession.status === 'incomplete' || currentSession.status === 'validating')) {
      // This is an incomplete session being completed
      console.log('Completing incomplete session:', currentSession.id);
      completeSession(currentSession.id);
      onFinish();
    } else {
      // Regular session flow
      onFinish();
    }
  };

  // Determine button text based on session type
  const getButtonText = () => {
    if (isCompleting) return 'Completing...';
    if (isReviewSession) return 'Complete';
    if (currentSession && (currentSession.status === 'incomplete' || currentSession.status === 'validating')) {
      return 'Complete Session';
    }
    return 'Take a Break';
  };

  return (
    <Card className="mb-6 min-h-[300px]">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Session Summary</h2>
        <div className="whitespace-pre-line mb-6 text-gray-700">
          {summary}
        </div>
        
        <div className="flex justify-center">
          <Button
            onClick={handleFinish}
            disabled={isCompleting}
            className="bg-green-500 hover:bg-green-600 px-6 py-3"
          >
            {getButtonText()}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryView;
