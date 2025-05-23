
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const ValidationPage = () => {
  const navigate = useNavigate();
  const { currentSession, completeSession } = useSession();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
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
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      // Complete the session and navigate to break
      if (currentSession) {
        completeSession(currentSession.id);
      }
      navigate('/break');
    }
  };
  
  const handleSkip = () => {
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
  
  const currentCard = flashcards[currentCardIndex];
  const isLastCard = currentCardIndex === flashcards.length - 1;
  
  return (
    <MainLayout>
      <div className="px-4">
        <h1 className="text-2xl font-semibold mb-6 text-center">Session Review</h1>
        
        <div className="text-center mb-4">
          <span className="text-sm text-gray-500">
            Card {currentCardIndex + 1} of {flashcards.length}
          </span>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">{currentCard.question}</h3>
              <p className="text-gray-600">{currentCard.answer}</p>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex gap-4 justify-center">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="px-6 py-3"
          >
            Skip
          </Button>
          
          <Button
            onClick={handleNext}
            className="bg-orange-500 hover:bg-orange-600 px-6 py-3"
          >
            {isLastCard ? 'Complete' : 'Next'}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default ValidationPage;
