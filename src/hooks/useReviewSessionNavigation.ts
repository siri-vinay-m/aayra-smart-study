
import { useState } from 'react';

export type ReviewStep = 'flashcards' | 'quiz' | 'summary';

export const useReviewSessionNavigation = () => {
  const [currentStep, setCurrentStep] = useState<ReviewStep>('flashcards');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  const handleNextCard = (totalCards: number) => {
    if (currentCardIndex < totalCards - 1) {
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

  const handleNextQuestion = (totalQuestions: number) => {
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    
    if (currentQuestionIndex < totalQuestions - 1) {
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

  return {
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
  };
};
