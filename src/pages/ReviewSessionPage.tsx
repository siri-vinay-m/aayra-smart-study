import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

const ReviewSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { pendingReviews, completedSessions, setPendingReviews } = useSession();
  const [currentTab, setCurrentTab] = useState('flashcards');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  
  // Find the review session based on the session ID
  const reviewSession = pendingReviews.find(review => review.sessionId === sessionId);
  
  // Simulated content from AI - these would be key points
  const flashcards = [
    { keyPoint: 'The principle of conservation of energy states that energy cannot be created or destroyed, only converted from one form to another.' },
    { keyPoint: 'Kinetic energy is the energy possessed by an object due to its motion, calculated as KE = 0.5mv².' },
    { keyPoint: 'Potential energy is the stored energy an object has due to its position or state, such as gravitational potential energy (PE = mgh).' },
    { keyPoint: 'The First Law of Thermodynamics is another expression of energy conservation, stating energy can be changed from one form to another, but cannot be created or destroyed.' },
    { keyPoint: 'Work in physics is defined as the product of the force applied to an object and the distance the object moves in the direction of the force (W = Fd cosθ).' },
  ];
  
  // Simulated quiz questions
  const quizQuestions = [
    {
      question: 'What does the principle of conservation of energy state?',
      options: [
        'Energy can be created but not destroyed.',
        'Energy can be destroyed but not created.',
        'Energy can be neither created nor destroyed, only converted from one form to another.',
        'Energy can be both created and destroyed under certain conditions.'
      ],
      correctAnswer: 'Energy can be neither created nor destroyed, only converted from one form to another.',
      explanation: 'The principle of conservation of energy states that energy cannot be created or destroyed, only converted from one form to another.'
    },
    {
      question: 'Which of the following is an example of potential energy?',
      options: [
        'A car moving at constant speed',
        'A book sitting on a high shelf',
        'A fan spinning',
        'Sound waves traveling through air'
      ],
      correctAnswer: 'A book sitting on a high shelf',
      explanation: 'A book on a high shelf has gravitational potential energy due to its height above the ground.'
    },
    {
      question: 'Kinetic energy is directly proportional to:',
      options: [
        'Mass only',
        'Velocity only',
        'The square of velocity',
        'The square of mass'
      ],
      correctAnswer: 'The square of velocity',
      explanation: 'The formula for kinetic energy is KE = 0.5mv², showing it is directly proportional to the square of velocity.'
    },
    {
      question: 'When work is done on an object, what happens to its energy?',
      options: [
        'It always increases',
        'It always decreases',
        'It can either increase or decrease depending on the direction of force',
        'It remains constant'
      ],
      correctAnswer: 'It can either increase or decrease depending on the direction of force',
      explanation: 'Positive work increases the energy of the object, while negative work decreases it.'
    },
    {
      question: 'Which of these conversions involves a change from kinetic to potential energy?',
      options: [
        'A ball rolling down a hill',
        'A car accelerating',
        'A thrown ball reaching its maximum height',
        'A light bulb turning on'
      ],
      correctAnswer: 'A thrown ball reaching its maximum height',
      explanation: 'As a ball is thrown upward, its kinetic energy is gradually converted to potential energy until it reaches maximum height.'
    },
    {
      question: 'The First Law of Thermodynamics is essentially:',
      options: [
        'The law of conservation of mass',
        'The law of conservation of energy',
        'The law of entropy',
        'Newton\'s first law'
      ],
      correctAnswer: 'The law of conservation of energy',
      explanation: 'The First Law of Thermodynamics is another way to express the law of conservation of energy.'
    },
  ];
  
  const summary = `
    This study session focused on energy principles in physics. We covered the conservation of energy, which states that energy cannot be created or destroyed, only converted from one form to another. We examined different types of energy, primarily kinetic energy (due to motion) and potential energy (due to position or state).
    
    The First Law of Thermodynamics was introduced as an extension of energy conservation. We also discussed work in physics as the product of force and displacement in the direction of force.
    
    Key formulas explored included:
    - Kinetic Energy: KE = 0.5mv²
    - Gravitational Potential Energy: PE = mgh
    - Work: W = Fd cosθ
    
    Understanding these principles is crucial for analyzing physical systems and predicting how energy transforms within them.
  `;
  
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
  
  const handleNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setCurrentTab('quiz');
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
      setCurrentTab('summary');
    }
  };
  
  const handleFinishReview = () => {
    // Remove the review from pending reviews
    setPendingReviews(prevReviews => prevReviews.filter(review => review.sessionId !== sessionId));
    
    // Navigate back to pending reviews
    navigate('/pending-reviews');
  };
  
  return (
    <MainLayout>
      <div className="px-4">
        <h1 className="text-xl font-semibold mb-4">{reviewSession.sessionName} - Review</h1>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="flashcards" disabled={currentTab !== 'flashcards'}>Flashcards</TabsTrigger>
            <TabsTrigger value="quiz" disabled={currentTab !== 'flashcards' && currentTab !== 'quiz'}>Quiz</TabsTrigger>
            <TabsTrigger value="summary" disabled={currentTab !== 'summary'}>Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="flashcards">
            <Card className="min-h-[300px] mb-6">
              <CardContent className="p-6">
                <div className="p-4 flex items-center justify-center min-h-[200px]">
                  <p className="text-lg font-medium text-center">{flashcards[currentCardIndex].keyPoint}</p>
                </div>
                
                <div className="text-center mt-4">
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-sm text-gray-500">
                      Key Point {currentCardIndex + 1} of {flashcards.length}
                    </div>
                    
                    <Button onClick={handleNextCard}>
                      {currentCardIndex < flashcards.length - 1 ? 'Next Key Point' : 'Start Quiz'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="quiz">
            <Card className="min-h-[300px] mb-6">
              <CardContent className="p-6">
                <p className="text-lg font-medium mb-4">Question {currentQuestionIndex + 1} of {quizQuestions.length}</p>
                <p className="mb-6">{quizQuestions[currentQuestionIndex].question}</p>
                
                <div className="space-y-3 mb-6">
                  {quizQuestions[currentQuestionIndex].options.map((option, index) => (
                    <div 
                      key={index} 
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedAnswer === option
                          ? 'border-primary bg-primary/10'
                          : 'hover:bg-gray-50'
                      } ${
                        isAnswerSubmitted && option === quizQuestions[currentQuestionIndex].correctAnswer
                          ? 'border-green-500 bg-green-50'
                          : ''
                      } ${
                        isAnswerSubmitted && selectedAnswer === option && option !== quizQuestions[currentQuestionIndex].correctAnswer
                          ? 'border-red-500 bg-red-50'
                          : ''
                      }`}
                      onClick={() => !isAnswerSubmitted && setSelectedAnswer(option)}
                    >
                      <div className="flex items-center">
                        <span className="mr-2">{String.fromCharCode(65 + index)}.</span>
                        <span>{option}</span>
                        {isAnswerSubmitted && option === quizQuestions[currentQuestionIndex].correctAnswer && (
                          <Check className="ml-auto text-green-500" />
                        )}
                        {isAnswerSubmitted && selectedAnswer === option && option !== quizQuestions[currentQuestionIndex].correctAnswer && (
                          <X className="ml-auto text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {isAnswerSubmitted && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-md">
                    <p className="font-medium mb-1">Explanation:</p>
                    <p>{quizQuestions[currentQuestionIndex].explanation}</p>
                  </div>
                )}
                
                <div className="flex justify-end">
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
          </TabsContent>
          
          <TabsContent value="summary">
            <Card className="min-h-[300px] mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Session Summary</h2>
                <div className="whitespace-pre-line mb-6">
                  {summary}
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleFinishReview}>
                    Complete Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ReviewSessionPage;
