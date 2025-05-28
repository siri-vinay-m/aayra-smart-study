
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
  const [currentTab, setCurrentTab] = useState('flashcards');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [aiContent, setAiContent] = useState<any>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  
  // Find the review session based on the session ID
  const reviewSession = pendingReviews.find(review => review.sessionId === sessionId) ||
    completedSessions.find(session => session.id === sessionId);
  
  useEffect(() => {
    const loadAIContent = async () => {
      if (!reviewSession || !sessionId) return;
      
      setIsLoadingContent(true);
      
      // Generate AI content based on uploaded materials for this session
      const generatedContent = await generateAIContentForSession(sessionId, reviewSession.sessionName);
      
      if (generatedContent) {
        setAiContent(generatedContent);
      }
      
      setIsLoadingContent(false);
    };

    loadAIContent();
  }, [sessionId, reviewSession, generateAIContentForSession]);

  // Use AI generated content if available, otherwise fallback to default content
  const flashcards = aiContent?.flashcards || [
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
  
  const quizQuestions = aiContent?.quizQuestions || [
    {
      question: "What was the main topic you studied?",
      options: ["Topic A", "Topic B", "Topic C", "Topic D"],
      correctAnswer: "Topic A",
      explanation: "This was the main focus of your study session."
    }
  ];
  
  const summary = aiContent?.summary || 
    "This study session covered important concepts. A detailed summary will be available after AI processing.";
  
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

  if (isLoadingContent) {
    return (
      <MainLayout>
        <div className="px-4 text-center py-8">
          <p className="text-lg text-gray-600">
            {isGenerating ? 'Generating AI content...' : 'Loading AI-generated content...'}
          </p>
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
            <div className="text-center mb-4">
              <span className="text-sm text-gray-500">
                Flashcard {currentCardIndex + 1} of {flashcards.length}
              </span>
            </div>
            <Card className="mb-6 min-h-[150px] flex flex-col justify-center">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-4">{flashcards[currentCardIndex].question}</h3>
                  <p className="text-gray-700">{flashcards[currentCardIndex].answer}</p>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-center">
              <Button
                onClick={handleNextCard}
                className="bg-orange-500 hover:bg-orange-600 px-6 py-3"
              >
                {currentCardIndex < flashcards.length - 1 ? 'Next' : 'Start Quiz'}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="quiz">
            <div className="text-center mb-4">
              <span className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {quizQuestions.length}
              </span>
            </div>
            <Card className="mb-6 min-h-[300px]">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">{quizQuestions[currentQuestionIndex].question}</h3>
                
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
          </TabsContent>
          
          <TabsContent value="summary">
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
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ReviewSessionPage;
