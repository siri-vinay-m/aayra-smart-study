
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { useSessionAI } from '@/hooks/useSessionAI';
import FlashcardView from '@/components/review/FlashcardView';
import QuizView from '@/components/review/QuizView';
import SummaryView from '@/components/review/SummaryView';
import LoadingState from '@/components/review/LoadingState';

const ReviewSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { pendingReviews, completedSessions, setPendingReviews } = useSession();
  const { generateAIContentForSession, isGenerating } = useSessionAI();
  
  const [currentStep, setCurrentStep] = useState<'flashcards' | 'quiz' | 'summary'>('flashcards');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [aiContent, setAiContent] = useState<any>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  
  // Find the review session based on the session ID
  const reviewSession = pendingReviews.find(review => review.sessionId === sessionId) ||
    completedSessions.find(session => session.id === sessionId);
  
  useEffect(() => {
    const loadAndGenerateAIContent = async () => {
      if (!reviewSession || !sessionId) return;
      
      setIsLoadingContent(true);
      
      try {
        // Generate AI content using the same flow as validation phase
        const generatedContent = await generateAIContentForSession(sessionId, reviewSession.sessionName);
        
        if (generatedContent) {
          setAiContent(generatedContent);
        } else {
          // Fallback to default content if AI generation fails
          setAiContent({
            flashcards: [
              {
                question: "What is the main concept you studied?",
                answer: "Key concept from your study session"
              },
              {
                question: "What are the important formulas?",
                answer: "Mathematical formulas you practiced"
              },
              {
                question: "What examples did you work through?",
                answer: "Practice problems and their solutions"
              }
            ],
            quizQuestions: [
              {
                question: "What was the main topic you studied?",
                options: ["Topic A", "Topic B", "Topic C", "Topic D"],
                correctAnswer: "Topic A",
                explanation: "This was the main focus of your study session."
              }
            ],
            summary: "AI processing was not available. Please review your study materials manually."
          });
        }
      } catch (error) {
        console.error('Error generating AI content:', error);
        // Fallback to default content
        setAiContent({
          flashcards: [
            {
              question: "What is the main concept you studied?",
              answer: "Key concept from your study session"
            }
          ],
          quizQuestions: [
            {
              question: "What was the main topic you studied?",
              options: ["Topic A", "Topic B", "Topic C", "Topic D"],
              correctAnswer: "Topic A",
              explanation: "This was the main focus of your study session."
            }
          ],
          summary: "There was an error processing your study materials. Please review them manually."
        });
      } finally {
        setIsLoadingContent(false);
      }
    };

    loadAndGenerateAIContent();
  }, [sessionId, reviewSession, generateAIContentForSession]);

  // Use AI generated content if available, otherwise fallback to empty arrays
  const flashcards = aiContent?.flashcards || [];
  const quizQuestions = aiContent?.quizQuestions || [];
  const summary = aiContent?.summary || "Loading summary...";
  
  useEffect(() => {
    if (!reviewSession) {
      navigate('/pending-reviews');
    }
  }, [reviewSession, navigate]);
  
  if (!reviewSession) {
    return (
      <MainLayout>
        <div className="px-4 text-center">
          <p className="text-lg text-gray-600">Review session not found.</p>
        </div>
      </MainLayout>
    );
  }

  // Check for loading states
  if (isLoadingContent || isGenerating) {
    return <LoadingState isLoading={true} />;
  }

  if (!aiContent || flashcards.length === 0) {
    return <LoadingState hasNoContent={true} />;
  }
  
  const handleNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setCurrentStep('quiz');
    }
  };
  
  const handleSubmitAnswer = () => {
    if (selectedAnswer) {
      setIsAnswerSubmitted(true);
    }
  };
  
  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentStep('summary');
    }
  };
  
  const handleFinishReview = () => {
    // Remove the review from pending reviews if it's a pending review
    if (pendingReviews.find(review => review.sessionId === sessionId)) {
      setPendingReviews(prevReviews => prevReviews.filter(review => review.sessionId !== sessionId));
    }
    
    // Navigate to home instead of back to the list
    navigate('/home');
  };

  const handleAnswerSelect = (answer: string) => {
    if (!isAnswerSubmitted) {
      setSelectedAnswer(answer);
    }
  };
  
  // Check for missing content in specific steps
  if (currentStep === 'flashcards' && !flashcards[currentCardIndex]) {
    return <LoadingState hasNoFlashcards={true} onSkipToQuiz={() => setCurrentStep('quiz')} />;
  }

  if (currentStep === 'quiz') {
    if (quizQuestions.length === 0) {
      return <LoadingState hasNoQuizQuestions={true} onViewSummary={() => setCurrentStep('summary')} />;
    }

    const currentQuestion = quizQuestions[currentQuestionIndex];
    if (!currentQuestion) {
      return <LoadingState hasNoQuizQuestions={true} onViewSummary={() => setCurrentStep('summary')} />;
    }
  }

  let pageContent;

  if (currentStep === 'flashcards') {
    pageContent = (
      <FlashcardView
        flashcards={flashcards}
        currentCardIndex={currentCardIndex}
        onNext={handleNextCard}
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
        onNext={handleNextQuestion}
      />
    );
  } else {
    pageContent = (
      <SummaryView
        summary={summary}
        onFinish={handleFinishReview}
        isReviewSession={true}
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
