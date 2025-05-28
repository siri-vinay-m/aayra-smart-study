
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { useSessionAI } from '@/hooks/useSessionAI';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

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

  if (isLoadingContent || isGenerating) {
    return (
      <MainLayout>
        <div className="px-4 text-center py-8">
          <p className="text-lg text-gray-600">
            Generating AI content...
          </p>
        </div>
      </MainLayout>
    );
  }

  // Add safety check for empty content
  if (!aiContent || flashcards.length === 0) {
    return (
      <MainLayout>
        <div className="px-4 text-center py-8">
          <p className="text-lg text-gray-600">
            No study materials found for this session.
          </p>
          <Button 
            onClick={() => navigate('/completed-sessions')}
            className="mt-4"
          >
            Back to Sessions
          </Button>
        </div>
      </MainLayout>
    );
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
    
    // Navigate back to the appropriate page
    if (pendingReviews.find(review => review.sessionId === sessionId)) {
      navigate('/pending-reviews');
    } else {
      navigate('/completed-sessions');
    }
  };
  
  let pageContent;

  if (currentStep === 'flashcards') {
    const currentCard = flashcards[currentCardIndex];
    
    // Add safety check for currentCard
    if (!currentCard) {
      return (
        <MainLayout>
          <div className="px-4 text-center py-8">
            <p className="text-lg text-gray-600">
              No flashcards available for this session.
            </p>
            <Button onClick={() => setCurrentStep('quiz')} className="mt-4">
              Skip to Quiz
            </Button>
          </div>
        </MainLayout>
      );
    }

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
    // Add safety check for quiz questions
    if (quizQuestions.length === 0) {
      return (
        <MainLayout>
          <div className="px-4 text-center py-8">
            <p className="text-lg text-gray-600">
              No quiz questions available for this session.
            </p>
            <Button onClick={() => setCurrentStep('summary')} className="mt-4">
              View Summary
            </Button>
          </div>
        </MainLayout>
      );
    }

    const currentQuestion = quizQuestions[currentQuestionIndex];
    
    // Add safety check for currentQuestion
    if (!currentQuestion) {
      return (
        <MainLayout>
          <div className="px-4 text-center py-8">
            <p className="text-lg text-gray-600">
              Quiz question not available.
            </p>
            <Button onClick={() => setCurrentStep('summary')} className="mt-4">
              View Summary
            </Button>
          </div>
        </MainLayout>
      );
    }

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
              {currentQuestion.options?.map((option, index) => (
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
                  <div className="flex items-center">
                    <span className="mr-2">{String.fromCharCode(65 + index)}.</span>
                    <span>{option}</span>
                    {isAnswerSubmitted && option === currentQuestion.correctAnswer && (
                      <Check className="ml-auto text-green-500" />
                    )}
                    {isAnswerSubmitted && selectedAnswer === option && option !== currentQuestion.correctAnswer && (
                      <X className="ml-auto text-red-500" />
                    )}
                  </div>
                </div>
              )) || <p>No options available</p>}
            </div>

            {isAnswerSubmitted && currentQuestion.explanation && (
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
                onClick={handleFinishReview}
                className="bg-green-500 hover:bg-green-600 px-6 py-3"
              >
                Complete Review
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

export default ReviewSessionPage;
