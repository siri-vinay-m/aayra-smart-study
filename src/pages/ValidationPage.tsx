
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { useTimer } from '@/contexts/TimerContext';
import FlashcardView from '@/components/review/FlashcardView';
import QuizView from '@/components/review/QuizView';
import SummaryView from '@/components/review/SummaryView';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSessionDiscard } from '@/hooks/useSessionDiscard';
import { useAIContentStorage } from '@/hooks/useAIContentStorage';
import { useQuizResponses } from '@/hooks/useQuizResponses';
import DiscardSessionDialog from '@/components/dialogs/DiscardSessionDialog';

const ValidationPage = () => {
  const navigate = useNavigate();
  const { currentSession, setCurrentSession, updateCurrentSessionStatus } = useSession();
  const { setTimerType } = useTimer();
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
  
  const { storeAIContent } = useAIContentStorage();
  const { storeAllQuizResponses } = useQuizResponses();
  
  const {
    showDiscardDialog,
    isInValidationPhase,
    handleNavigationAttempt,
    handleDiscardSession,
    handleCancelDiscard,
  } = useSessionDiscard();
  
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
    // Only show discard dialog if we're in validation phase and not on summary step
    if (currentStep !== 'summary') {
      handleNavigationAttempt('/home');
    } else {
      // If on summary, just navigate back normally
      navigate('/home');
    }
  };
  
  const handleNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
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
    
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentStep('summary');
    }
  };
  
  const handleFinishValidation = async () => {
    if (currentSession) {
      console.log('Finishing validation, session status:', currentSession.status);
      
      // Store AI content and quiz responses before finishing
      if (currentSession.aiGeneratedContent) {
        await storeAIContent(currentSession.id, currentSession.aiGeneratedContent, 0);
      }
      
      if (quizResponses.length > 0) {
        const formattedResponses = quizResponses.map(response => ({
          questionIndex: response.questionIndex,
          questionText: quizQuestions[response.questionIndex]?.question || '',
          selectedAnswer: response.selectedAnswer,
          correctAnswer: response.correctAnswer,
          isCorrect: response.isCorrect
        }));
        await storeAllQuizResponses(currentSession.id, formattedResponses, 0);
      }
      
      // Check if this is a completed session being reviewed (no longer using 'incomplete' status)
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
        navigate('/break-timer');
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
        onQuizResponse={handleQuizResponse}
      />
    );
  } else {
    pageContent = (
      <SummaryView
        summary={summary}
        onFinish={handleFinishValidation}
        isReviewSession={currentSession.status === 'completed'}
        reviewStage={0} // For new sessions, always use stage 0
        sessionId={currentSession.id}
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
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
        {pageContent}
      </div>
      
      <DiscardSessionDialog
        open={showDiscardDialog}
        onOpenChange={handleCancelDiscard}
        onConfirm={handleDiscardSession}
        isValidationPhase={isInValidationPhase}
      />
    </MainLayout>
  );
};

export default ValidationPage;
