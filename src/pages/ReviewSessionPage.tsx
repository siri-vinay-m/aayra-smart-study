
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import FlashcardView from '@/components/review/FlashcardView';
import QuizView from '@/components/review/QuizView';
import SummaryView from '@/components/review/SummaryView';
import ReviewSessionLoading from '@/components/review/ReviewSessionLoading';
import ReviewSessionError from '@/components/review/ReviewSessionError';
import { useReviewSessionContent } from '@/hooks/useReviewSessionContent';
import { useReviewSessionNavigation } from '@/hooks/useReviewSessionNavigation';

const ReviewSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { pendingReviews, completedSessions, incompleteSessions } = useSession();
  
  const {
    currentStep,
    currentCardIndex,
    currentQuestionIndex,
    selectedAnswer,
    isAnswerSubmitted,
    handleNextCard,
    handleSubmitAnswer,
    handleNextQuestion,
    handleAnswerSelect,
    setCurrentStep
  } = useReviewSessionNavigation();
  
  // Find the review session based on the session ID - check all possible sources
  const reviewSession = pendingReviews.find(review => review.sessionId === sessionId) ||
    completedSessions.find(session => session.id === sessionId) ||
    incompleteSessions.find(session => session.id === sessionId);
  
  const { aiContent, isLoadingContent, hasError } = useReviewSessionContent(reviewSession, sessionId);
  
  useEffect(() => {
    if (!reviewSession) {
      navigate('/home');
    }
  }, [reviewSession, navigate]);
  
  if (!reviewSession) {
    return (
      <ReviewSessionError message="Review session not found." />
    );
  }

  if (isLoadingContent) {
    return <ReviewSessionLoading />;
  }

  if (hasError) {
    return (
      <ReviewSessionError message="Unable to load review content. Please try again later." />
    );
  }

  if (!aiContent || !aiContent.flashcards.length) {
    return (
      <ReviewSessionError message="No study materials found for this session." />
    );
  }

  // Use AI generated content
  const flashcards = aiContent.flashcards;
  const quizQuestions = aiContent.quizQuestions;
  const summary = aiContent.summary;
  
  const handleFinishReview = () => {
    navigate('/home');
  };
  
  // Check for missing content in specific steps
  if (currentStep === 'flashcards' && !flashcards[currentCardIndex]) {
    setCurrentStep('quiz');
    return null;
  }

  if (currentStep === 'quiz') {
    if (quizQuestions.length === 0) {
      setCurrentStep('summary');
      return null;
    }

    const currentQuestion = quizQuestions[currentQuestionIndex];
    if (!currentQuestion) {
      setCurrentStep('summary');
      return null;
    }
  }

  // Find the review entry ID for completion
  const reviewEntry = pendingReviews.find(review => review.sessionId === sessionId);
  const reviewId = reviewEntry?.id;

  let pageContent;

  if (currentStep === 'flashcards') {
    pageContent = (
      <FlashcardView
        flashcards={flashcards}
        currentCardIndex={currentCardIndex}
        onNext={() => handleNextCard(flashcards.length)}
      />
    );
  } else if (currentStep === 'quiz') {
    pageContent = (
      <QuizView
        quizQuestions={quizQuestions}
        currentQuestionIndex={currentQuestionIndex}
        selectedAnswer={selectedAnswer}
        isAnswerSubmitted={isAnswerSubmitted}
        onAnswerSelect={handleAnswerSelect}
        onSubmitAnswer={handleSubmitAnswer}
        onNext={() => handleNextQuestion(quizQuestions.length)}
      />
    );
  } else {
    pageContent = (
      <SummaryView
        summary={summary}
        onFinish={handleFinishReview}
        isReviewSession={true}
        reviewId={reviewId}
        sessionId={sessionId}
      />
    );
  }
  
  return (
    <MainLayout>
      <div className="px-4">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          {currentStep === 'flashcards' ? 'Review Flashcards' : 
           currentStep === 'quiz' ? 'Knowledge Check' : 'Session Summary'}
        </h1>
        {pageContent}
      </div>
    </MainLayout>
  );
};

export default ReviewSessionPage;
