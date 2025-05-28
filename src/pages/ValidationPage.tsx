
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { useTimer } from '@/contexts/TimerContext';
import FlashcardView from '@/components/review/FlashcardView';
import QuizView from '@/components/review/QuizView';
import SummaryView from '@/components/review/SummaryView';

const ValidationPage = () => {
  const navigate = useNavigate();
  const { currentSession, setCurrentSession, updateCurrentSessionStatus } = useSession();
  const { setTimerType } = useTimer();
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
  
  const handleStartBreak = async () => {
    if (currentSession) {
      // Update session status to break_pending and then immediately to break_inprogress
      const updatedSession = { ...currentSession, status: 'break_inprogress' as const };
      setCurrentSession(updatedSession);
      await updateCurrentSessionStatus('break_inprogress');
      
      // Set timer type to break for the next page
      setTimerType('break');
      
      // Navigate to break timer page
      navigate('/break');
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
        onFinish={handleStartBreak}
        isReviewSession={false}
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

export default ValidationPage;
