
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Sample flashcard data (in real app, this would come from AI)
const sampleFlashcards = [
  {
    id: 'fc1',
    front: 'What is a derivative?',
    back: 'A derivative measures the rate at which a function changes at a specific point.'
  },
  {
    id: 'fc2',
    front: 'What is the chain rule?',
    back: 'The chain rule is a formula for computing the derivative of a composite function.'
  },
  {
    id: 'fc3',
    front: 'What is an integral?',
    back: 'An integral represents the area under a curve of a function.'
  },
  {
    id: 'fc4',
    front: 'What is the power rule?',
    back: 'The power rule states that the derivative of x^n is n*x^(n-1).'
  },
  {
    id: 'fc5',
    front: 'What is the product rule?',
    back: 'The product rule is used to find the derivative of a product of two functions.'
  }
];

// Sample quiz data
const sampleQuiz = [
  {
    id: 'q1',
    question: 'What is the derivative of x²?',
    options: ['x', '2x', '2x²', 'x²'],
    answer: '2x',
    explanation: 'Using the power rule, the derivative of x² is 2x.'
  },
  {
    id: 'q2',
    question: 'Is the integral of a constant function equal to the constant times x plus C?',
    options: ['True', 'False'],
    answer: 'True',
    explanation: 'The integral of a constant k is kx + C.'
  },
  {
    id: 'q3',
    question: 'Which of the following is NOT a technique of integration?',
    options: ['Substitution', 'Integration by parts', 'Chain rule', 'Partial fractions'],
    answer: 'Chain rule',
    explanation: 'Chain rule is a differentiation technique, not an integration technique.'
  },
];

// Sample summary
const sampleSummary = 'Calculus is the mathematical study of continuous change. The two main branches are differential calculus and integral calculus. Differential calculus focuses on rates of change and slopes of curves, while integral calculus focuses on accumulation of quantities and the areas under curves. Key concepts include limits, derivatives, and integrals.';

const ValidationPage = () => {
  const { currentSession, setCurrentSession, setCompletedSessions } = useSession();
  const navigate = useNavigate();
  const [step, setStep] = useState<'flashcards' | 'quiz' | 'summary'>('flashcards');
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  
  useEffect(() => {
    if (!currentSession) {
      navigate('/');
    }
  }, [currentSession, navigate]);
  
  if (!currentSession) {
    return null;
  }
  
  const handleNextFlashcard = () => {
    if (currentFlashcardIndex < sampleFlashcards.length - 1) {
      setCurrentFlashcardIndex(currentFlashcardIndex + 1);
      setFlipped(false);
    } else {
      setStep('quiz');
    }
  };
  
  const handleSubmitAnswer = () => {
    if (!answers[sampleQuiz[currentQuizIndex].id]) {
      return; // No answer selected
    }
    
    setShowExplanation(true);
  };
  
  const handleNextQuestion = () => {
    setShowExplanation(false);
    if (currentQuizIndex < sampleQuiz.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
    } else {
      setStep('summary');
    }
  };
  
  const handleTakeBreak = () => {
    // Update session as completed
    const updatedSession = {
      ...currentSession,
      status: 'completed'
    };
    
    setCurrentSession(null);
    
    setCompletedSessions(prevSessions => [updatedSession, ...prevSessions]);
    
    navigate('/break');
  };
  
  const renderFlashcards = () => {
    const flashcard = sampleFlashcards[currentFlashcardIndex];
    
    return (
      <div className="flex flex-col items-center">
        <div className="text-sm text-gray-500 mb-2">
          Flashcard {currentFlashcardIndex + 1} of {sampleFlashcards.length}
        </div>
        
        <div 
          className={`w-full h-60 perspective-1000 transition-transform duration-700 cursor-pointer ${flipped ? 'rotate-y-180' : ''}`}
          onClick={() => setFlipped(!flipped)}
        >
          <div className={`relative w-full h-full transition-all duration-700 transform-style-3d`}>
            <div className={`absolute w-full h-full bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-center transition-transform duration-700 ${flipped ? 'opacity-0 -rotate-y-180' : 'backface-hidden'}`}>
              <h3 className="text-xl font-medium text-center">{flashcard.front}</h3>
            </div>
            
            <div className={`absolute w-full h-full bg-primary/5 border border-primary/20 rounded-lg p-6 flex items-center justify-center transition-transform duration-700 ${flipped ? 'backface-hidden' : 'opacity-0 rotate-y-180'}`}>
              <p className="text-center">{flashcard.back}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 w-full">
          <Button 
            onClick={handleNextFlashcard}
            className="w-full bg-primary hover:bg-primary-dark"
          >
            {currentFlashcardIndex < sampleFlashcards.length - 1 ? 'Next' : 'Start Quiz'}
          </Button>
        </div>
      </div>
    );
  };
  
  const renderQuiz = () => {
    const question = sampleQuiz[currentQuizIndex];
    
    return (
      <div className="space-y-6">
        <div className="text-sm text-gray-500">
          Question {currentQuizIndex + 1} of {sampleQuiz.length}
        </div>
        
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">{question.question}</h3>
          
          <RadioGroup 
            value={answers[question.id]} 
            onValueChange={(value) => setAnswers({...answers, [question.id]: value})}
            className="space-y-3"
            disabled={showExplanation}
          >
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center">
                <RadioGroupItem 
                  value={option} 
                  id={`option-${index}`} 
                  className="mr-2"
                />
                <Label 
                  htmlFor={`option-${index}`}
                  className={
                    showExplanation && option === question.answer
                      ? 'text-success font-medium'
                      : showExplanation && answers[question.id] === option && option !== question.answer
                      ? 'text-destructive'
                      : ''
                  }
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          {showExplanation && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Explanation:</span> {question.explanation}
              </p>
            </div>
          )}
        </Card>
        
        <div>
          {showExplanation ? (
            <Button 
              onClick={handleNextQuestion}
              className="w-full bg-primary hover:bg-primary-dark"
            >
              {currentQuizIndex < sampleQuiz.length - 1 ? 'Next Question' : 'View Summary'}
            </Button>
          ) : (
            <Button 
              onClick={handleSubmitAnswer}
              className="w-full bg-primary hover:bg-primary-dark"
              disabled={!answers[question.id]}
            >
              Submit Answer
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  const renderSummary = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-medium">Session Summary</h3>
        
        <Card className="p-4">
          <p className="text-gray-700">{sampleSummary}</p>
        </Card>
        
        <Button 
          onClick={handleTakeBreak}
          className="w-full bg-primary hover:bg-primary-dark"
        >
          Take a Break
        </Button>
      </div>
    );
  };
  
  return (
    <MainLayout>
      <div className="px-4">
        <h1 className="text-2xl font-semibold mb-2">Validation</h1>
        <p className="text-gray-600 mb-6">Let's review what you've learned</p>
        
        {step === 'flashcards' && renderFlashcards()}
        {step === 'quiz' && renderQuiz()}
        {step === 'summary' && renderSummary()}
      </div>
    </MainLayout>
  );
};

export default ValidationPage;
