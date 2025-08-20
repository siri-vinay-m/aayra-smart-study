
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';

interface LoadingStateProps {
  isLoading?: boolean;
  hasNoContent?: boolean;
  hasNoFlashcards?: boolean;
  hasNoQuizQuestions?: boolean;
  onSkipToQuiz?: () => void;
  onViewSummary?: () => void;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  hasNoContent,
  hasNoFlashcards,
  hasNoQuizQuestions,
  onSkipToQuiz,
  onViewSummary
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="px-4 text-center py-8">
          <p className="text-lg text-muted-foreground">
            Generating AI content...
          </p>
        </div>
      </MainLayout>
    );
  }

  if (hasNoContent) {
    return (
      <MainLayout>
        <div className="px-4 text-center py-8">
          <p className="text-lg text-muted-foreground">
            No study materials found for this session.
          </p>
          <Button 
            onClick={() => navigate('/completed-sessions')}
            className="mt-4"
          >
            Back to Sessions
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (hasNoFlashcards) {
    return (
      <MainLayout>
        <div className="px-4 text-center py-8">
          <p className="text-lg text-muted-foreground">
            No flashcards available for this session.
          </p>
          <Button onClick={onSkipToQuiz} className="mt-4">
            Skip to Quiz
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (hasNoQuizQuestions) {
    return (
      <MainLayout>
        <div className="px-4 text-center py-8">
          <p className="text-lg text-muted-foreground">
            No quiz questions available for this session.
          </p>
          <Button onClick={onViewSummary} className="mt-4">
            View Summary
          </Button>
        </div>
      </MainLayout>
    );
  }

  return null;
};

export default LoadingState;
