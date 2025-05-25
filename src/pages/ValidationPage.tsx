
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const ValidationPage = () => {
  const navigate = useNavigate();
  const { currentSession, completeSession, setCurrentSession } = useSession(); // Added setCurrentSession
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<'flashcards' | 'quiz'>('flashcards'); // Step 2: State for flow control
  
  // Mock flashcards data - in real app this would come from the session
  const flashcards = [
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
  
  const handleNext = () => {
    if (currentStep === 'flashcards') {
      if (currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
        // Last flashcard, transition to quiz
        setCurrentStep('quiz'); // Step 4: Defining "Flashcards Completed"
      }
    }
    // If currentStep is 'quiz', this button might be "Submit Quiz" - handled by specific quiz button
  };
  
  const handleCompleteQuiz = () => {
    // This function will be called by a button in the quiz section
    if (currentSession) {
      // Update session status before completing
      if (setCurrentSession) { // Check if setCurrentSession is available
         setCurrentSession(prev => prev ? ({ ...prev, status: 'break_pending' }) : null);
      }
      // Ideally, completeSession should also update status in DB to 'break_pending' or similar before 'completed'
      // For now, using existing completeSession then navigating to /break
      completeSession(currentSession.id); // This sets status to 'completed' and currentSession to null
    }
    navigate('/break');
  };

  const handleSkip = () => {
    // Skips the entire validation phase (flashcards and quiz)
    if (currentSession) {
      // Optionally mark as completed or a specific skipped status
      // For now, just navigate to break, session will remain in 'validating' or its current state
      // unless completeSession is called. Let's assume skipping validation means not completing it.
      if (setCurrentSession) {
        setCurrentSession(prev => prev ? ({ ...prev, status: 'break_pending' }) : null);
      }
    }
    navigate('/break');
  };
  
  if (!currentSession) {
    return (
      <MainLayout>
        <div className="px-4 text-center">
          <p className="text-lg text-gray-600">No active session found.</p>
        </div>
      </MainLayout>
    );
  }
  
  // Determine content based on currentStep
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
              <h3 className="text-lg font-medium mb-2">{currentCard.question}</h3>
              <p className="text-gray-700">{currentCard.answer}</p>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-4 justify-center">
          <Button onClick={handleSkip} variant="outline" className="px-6 py-3">
            Skip Review
          </Button>
          <Button
            onClick={handleNext}
            className="bg-orange-500 hover:bg-orange-600 px-6 py-3"
          >
            {isLastFlashcard ? 'Start Quiz' : 'Next Card'}
          </Button>
        </div>
      </>
    );
  } else { // currentStep === 'quiz'
    pageContent = (
      <>
        <h2 className="text-xl font-semibold mb-4 text-center">Quiz Time!</h2>
        <Card className="mb-6 min-h-[150px] flex flex-col justify-center">
          <CardContent className="p-6 text-center">
            <p>Quiz questions and interactions would appear here.</p>
            {/* Placeholder for quiz content */}
          </CardContent>
        </Card>
        <div className="flex gap-4 justify-center">
           <Button onClick={handleSkip} variant="outline" className="px-6 py-3">
            Skip Quiz
          </Button>
          <Button
            onClick={handleCompleteQuiz}
            className="bg-green-500 hover:bg-green-600 px-6 py-3"
          >
            Submit Quiz & Finish
          </Button>
        </div>
      </>
    );
  }
  
  return (
    <MainLayout>
      <div className="px-4">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          {currentStep === 'flashcards' ? 'Review Flashcards' : 'Knowledge Check'}
        </h1>
        {pageContent}
      </div>
    </MainLayout>
  );
};

export default ValidationPage;
