
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ReviewSessionErrorProps {
  message?: string;
  onRetry?: () => void;
}

const ReviewSessionError: React.FC<ReviewSessionErrorProps> = ({ 
  message = "Unable to load review session. Please try again.",
  onRetry
}) => {
  const navigate = useNavigate();

  return (
    <div className="px-4 text-center py-8">
      <p className="text-lg text-muted-foreground mb-4">{message}</p>
      <div className="space-x-4">
        {onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
          >
            Try Again
          </Button>
        )}
        <Button 
          onClick={() => navigate('/home')}
          className="bg-primary text-white hover:bg-primary/90"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default ReviewSessionError;
