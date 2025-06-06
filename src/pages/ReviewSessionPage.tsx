import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { useReviewSessionContent } from '@/hooks/useReviewSessionContent';
import FlashcardView from '@/components/review/FlashcardView';
import QuizView from '@/components/review/QuizView';
import SummaryView from '@/components/review/SummaryView';
import LoadingState from '@/components/review/LoadingState';
import ReviewSessionError from '@/components/review/ReviewSessionError';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReviewCompletion } from '@/hooks/useReviewCompletion';
import { PendingReview } from '@/types/session';

const ReviewSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { pendingReviews, completedSessions, setCurrentSession, markReviewAsCompleted } = useSession();
  const [currentStep, setCurrentStep] = useState<'flashcards' | 'quiz' | 'summary'>('flashcards');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizResponses, setQuizResponses] = useState<Array<{
    questionIndex: number;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>>([]);

  const { completeReviewSession } = useReviewCompletion();

  // Find the review session from either pending reviews or completed sessions
  const reviewSession = React.useMemo(() => {
    const pendingReview = pendingReviews.find(review => review.sessionId === sessionId);
    if (pendingReview) return pendingReview;
    
    const completedSession = completedSessions.find(session => session.id === sessionId);
    if (completedSession) {
      // Convert completed session to review session format with all required properties
      const convertedSession: PendingReview = {
        id: completedSession.id,
        sessionId: completedSession.id,
        sessionName: completedSession.sessionName,
        subjectName: completedSession.subjectName,
        topicName: completedSession.topicName,
        reviewStage: 'Review',
        dueDate: new Date().toISOString(),
        completedAt: new Date(),
        aiGeneratedContent: completedSession.aiGeneratedContent
      };
      return convertedSession;
    }
    
    return null;
  }, [sessionId, pendingReviews, completedSessions]);

  const { aiContent, isLoadingContent, hasError } = useReviewSessionContent(reviewSession, sessionId);

  useEffect(() => {
    if (reviewSession && aiContent) {
      // Set up the session as current session for validation flow
      const isFromCompletedSessions = completedSessions.some(session => session.id === sessionId);
      const reviewStageNumber = typeof reviewSession.reviewStage === 'string' ? 0 : reviewSession.reviewStage;
      
      const sessionForValidation = {
        id: sessionId!,
        sessionName: reviewSession.sessionName,
        subjectName: reviewSession.subjectName,
        topicName: reviewSession.topicName,
        status: isFromCompletedSessions ? 'completed' as const : 'validating' as const,
        reviewStage: reviewStageNumber,
        aiGeneratedContent: aiContent,
        focusDuration: 25 * 60,
        breakDuration: 5 * 60,
        focusDurationMinutes: 25,
        breakDurationMinutes: 5,
        createdAt: new Date(),
        startTime: new Date(),
        completedAt: undefined,
        isFavorite: false
      };
      setCurrentSession(sessionForValidation);
    }
  }, [reviewSession, aiContent, sessionId, setCurrentSession, completedSessions]);

  if (isLoadingContent) {
    return (
      <MainLayout>
        <LoadingState />
      </MainLayout>
    );
  }

  if (hasError || !reviewSession || !aiContent) {
    return (
      <MainLayout>
        <ReviewSessionError
          onRetry={() => window.location.reload()}
        />
      </MainLayout>
    );
  }

  const handleBackButton = async () => {
    const isFromCompletedSessions = completedSessions.some(session => session.id === sessionId);
    const isPendingReview = pendingReviews.some(review => review.sessionId === sessionId);
    
    if (isPendingReview) {
      // For pending reviews, mark as completed and go to home
      const success = await markReviewAsCompleted(reviewSession.id);
      if (success) {
        navigate('/home');
      } else {
        navigate('/pending-reviews');
      }
    } else if (isFromCompletedSessions) {
      navigate('/completed-sessions');
    } else {
      navigate('/pending-reviews');
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < aiContent.flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setCurrentStep('quiz');
    }
  };

  const handleQuizResponse = (questionIndex: number, selectedAnswer: string, correctAnswer: string) => {
    const isCorrect = selectedAnswer === correctAnswer;
    const response = {
      questionIndex,
      selectedAnswer,
      correctAnswer,
      isCorrect
    };
    
    setQuizResponses(prev => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(r => r.questionIndex === questionIndex);
      if (existingIndex >= 0) {
        updated[existingIndex] = response;
      } else {
        updated.push(response);
      }
      return updated;
    });
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer) {
      setIsAnswerSubmitted(true);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    
    if (currentQuestionIndex < aiContent.quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentStep('summary');
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (!isAnswerSubmitted) {
      setSelectedAnswer(answer);
    }
  };

  const handleFinishReview = async () => {
    const isFromCompletedSessions = completedSessions.some(session => session.id === sessionId);
    const isPendingReview = pendingReviews.some(review => review.sessionId === sessionId);
    
    if (isFromCompletedSessions) {
      // For completed sessions, just go back to home - no PDF generation
      setCurrentSession(null);
      navigate('/home');
    } else if (isPendingReview) {
      // For pending reviews, complete the review process and mark as completed
      const reviewStageNumber = typeof reviewSession.reviewStage === 'string' ? 1 : reviewSession.reviewStage;
      await completeReviewSession(sessionId!, aiContent, quizResponses, reviewStageNumber);
      await markReviewAsCompleted(reviewSession.id);
      setCurrentSession(null);
      navigate('/home');
    } else {
      // For other sessions, complete normally
      const reviewStageNumber = typeof reviewSession.reviewStage === 'string' ? 1 : reviewSession.reviewStage;
      await completeReviewSession(sessionId!, aiContent, quizResponses, reviewStageNumber);
      setCurrentSession(null);
    }
  };

  // Determine session type for SummaryView
  const getSessionType = () => {
    const isFromCompletedSessions = completedSessions.some(session => session.id === sessionId);
    return isFromCompletedSessions ? 'completed' : 'pending';
  };

  let pageContent;

  if (currentStep === 'flashcards') {
    pageContent = (
      <FlashcardView
        flashcards={aiContent.flashcards}
        currentCardIndex={currentCardIndex}
        onNext={handleNextCard}
      />
    );
  } else if (currentStep === 'quiz') {
    pageContent = (
      <QuizView
        quizQuestions={aiContent.quizQuestions}
        currentQuestionIndex={currentQuestionIndex}
        selectedAnswer={selectedAnswer}
        isAnswerSubmitted={isAnswerSubmitted}
        onAnswerSelect={handleAnswerSelect}
        onSubmitAnswer={handleSubmitAnswer}
        onNext={handleNextQuestion}
        onQuizResponse={handleQuizResponse}
      />
    );
  } else {
    pageContent = (
      <SummaryView
        summary={aiContent.summary}
        onFinish={handleFinishReview}
        sessionType={getSessionType()}
        sessionId={sessionId}
        quizResponses={quizResponses}
      />
    );
  }

  return (
    <MainLayout>
      <div className="px-4">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={handleBackButton}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-center flex-1">
            {currentStep === 'flashcards' ? 'Review Flashcards' : 
             currentStep === 'quiz' ? 'Knowledge Check' : 'Session Summary'}
          </h1>
          <div className="w-16" />
        </div>
        {pageContent}
      </div>
    </MainLayout>
  );
};

export default ReviewSessionPage;
