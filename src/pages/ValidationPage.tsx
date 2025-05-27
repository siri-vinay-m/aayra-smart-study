
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { useTimer } from '@/contexts/TimerContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const ValidationPage = () => {
  const navigate = useNavigate();
  const { currentSession, completeSession, setCurrentSession, updateCurrentSessionStatus } = useSession();
  const { setTimerType } = useTimer();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<'flashcards' | 'quiz' | 'summary'>('flashcards');
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
  
  const handleCompleteQuiz = async () => {
    if (currentSession) {
      // Update session status to break pending
      if (setCurrentSession) {
        setCurrentSession({...currentSession, status: 'break_pending'});
      }
      await updateCurrentSessionStatus('break_pending');
      
      // Set timer type to break for the next page
      setTimerType('break');
      
      completeSession(currentSession.id);
    }
    navigate('/break');
  };
  
  let pageContent;

  if (currentStep === 'flashcards') {
    const currentCard = flashcards[currentCardIndex];
    const isLastFlashcard = currentCardIndex === flashcards.length - 1;
    pageContent = (
      <>
        <div className="text-center mb-4">
          <span className="text-sm text-gray-500">
            Flashcard {currentCardIndex + 1} of {flashcards.length}
          </span>
        </div>
        <Card className="mb-6 min-h-[150px] flex flex-col justify-center">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">{currentCard.question}</h3>
              <p className="text-gray-700">{currentCard.answer}</p>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-center">
          <Button
            onClick={handleNextCard}
            className="bg-orange-500 hover:bg-orange-600 px-6 py-3"
          >
            {isLastFlashcard ? 'Start Quiz' : 'Next'}
          </Button>
        </div>
      </>
    );
  } else if (currentStep === 'quiz') {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    pageContent = (
      <>
        <div className="text-center mb-4">
          <span className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {quizQuestions.length}
          </span>
        </div>
        <Card className="mb-6 min-h-[300px]">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>
            
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, index) => (
                <div 
                  key={index} 
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedAnswer === option
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-gray-50'
                  } ${
                    isAnswerSubmitted && option === currentQuestion.correctAnswer
                      ? 'border-green-500 bg-green-50'
                      : ''
                  } ${
                    isAnswerSubmitted && selectedAnswer === option && option !== currentQuestion.correctAnswer
                      ? 'border-red-500 bg-red-50'
                      : ''
                  }`}
                  onClick={() => !isAnswerSubmitted && setSelectedAnswer(option)}
                >
                  <span>{option}</span>
                </div>
              ))}
            </div>

            {isAnswerSubmitted && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
                <p className="font-medium mb-1">Explanation:</p>
                <p>{currentQuestion.explanation}</p>
              </div>
            )}
            
            <div className="flex justify-center">
              {!isAnswerSubmitted ? (
                <Button onClick={handleSubmitAnswer} disabled={!selectedAnswer}>
                  Submit Answer
                </Button>
              ) : (
                <Button onClick={handleNextQuestion}>
                  {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'View Summary'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </>
    );
  } else {
    pageContent = (
      <>
        <Card className="mb-6 min-h-[300px]">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Session Summary</h2>
            <div className="whitespace-pre-line mb-6 text-gray-700">
              {summary}
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={handleCompleteQuiz}
                className="bg-green-500 hover:bg-green-600 px-6 py-3"
              >
                Complete Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
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
