
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { useTimer } from '@/contexts/TimerContext';
import FlashcardView from '@/components/review/FlashcardView';
import QuizView from '@/components/review/QuizView';
import SummaryView from '@/components/review/SummaryView';
import DiscardSessionDialog from '@/components/dialogs/DiscardSessionDialog';
import { useSessionDiscard } from '@/hooks/useSessionDiscard';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ValidationPage = () => {
  const navigate = useNavigate();
  const { currentSession, setCurrentSession, updateCurrentSessionStatus, completeSession, markSessionAsIncomplete } = useSession();
  const { setTimerType } = useTimer();
  const { 
    showDiscardDialog, 
    handleNavigationAttempt, 
    handleDiscardSession, 
    handleCancelDiscard,
    getDialogMessage 
  } = useSessionDiscard();
  
  const [currentStep, setCurrentStep] = useState<'flashcards' | 'quiz' | 'summary'>('flashcards');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  
  if (!currentSession) {
    return (
      <MainLayout>
        <div className="px-4 text-center">
          <p className="text-lg text-gray-600">No active session found.</p>
        </div>
      </MainLayout>
    );
  }

  // Use AI generated content if available, otherwise fallback to default content
  const flashcards = currentSession.aiGeneratedContent?.flashcards || [
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
  ];

  const quizQuestions = currentSession.aiGeneratedContent?.quizQuestions || [
    {
      question: "What was the main topic you studied?",
      options: ["Topic A", "Topic B", "Topic C", "Topic D"],
      correctAnswer: "Topic A",
      explanation: "This was the main focus of your study session."
    }
  ];

  const summary = currentSession.aiGeneratedContent?.summary || 
    "This study session covered important concepts. A detailed summary will be available after AI processing.";
  
  const handleBackButton = () => {
    handleNavigationAttempt('/home');
  };

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
  
  const handleFinishValidation = async () => {
    if (currentSession) {
      console.log('Finishing validation, session status:', currentSession.status);
      
      // Check if this is a completed session being reviewed
      if (currentSession.status === 'completed') {
        console.log('Completing review of completed session');
        setCurrentSession(null);
        navigate('/home');
      } else {
        console.log('Regular session flow - going to break');
        // Update status to 'break_in_progress' when user clicks "Take a Break"
        const updatedSession = { ...currentSession, status: 'break_in_progress' as const };
        setCurrentSession(updatedSession);
        await updateCurrentSessionStatus('break_in_progress');
        navigate('/break');
      }
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (!isAnswerSubmitted) {
      setSelectedAnswer(answer);
    }
  };
  
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
        onFinish={handleFinishValidation}
        isReviewSession={currentSession.status === 'completed'}
      />
    );
  }
  
  return (
    <MainLayout onNavigationAttempt={handleNavigationAttempt}>
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
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
        {pageContent}
      </div>
      
      <DiscardSessionDialog
        open={showDiscardDialog}
        onOpenChange={handleCancelDiscard}
        onConfirm={handleDiscardSession}
        message={getDialogMessage()}
      />
    </MainLayout>
  );
};

export default ValidationPage;
