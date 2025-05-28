
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { useSessionAI } from '@/hooks/useSessionAI';
import FlashcardView from '@/components/review/FlashcardView';
import QuizView from '@/components/review/QuizView';
import SummaryView from '@/components/review/SummaryView';

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
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Find the review session based on the session ID
  const reviewSession = pendingReviews.find(review => review.sessionId === sessionId) ||
    completedSessions.find(session => session.id === sessionId);
  
  useEffect(() => {
    const loadAndGenerateAIContent = async () => {
      if (!reviewSession || !sessionId) {
        setIsLoadingContent(false);
        setHasError(true);
        return;
      }
      
      setIsLoadingContent(true);
      setHasError(false);
      
      try {
        console.log('Loading AI content for session:', sessionId, reviewSession.sessionName);
        
        // Generate AI content using the same flow as validation phase
        const generatedContent = await generateAIContentForSession(sessionId, reviewSession.sessionName);
        
        if (generatedContent) {
          console.log('AI content loaded successfully');
          setAiContent(generatedContent);
        } else {
          console.log('AI content generation failed, using default content');
          // Fallback to default content if AI generation fails
          setAiContent({
            flashcards: [
              {
                question: `What was the main topic covered in the "${reviewSession.sessionName}" session?`,
                answer: "This session covered important educational concepts. Review the uploaded materials to understand the main ideas and practice applying them to reinforce your learning."
              },
              {
                question: "What are the key learning objectives for this study session?",
                answer: "Focus on understanding the core concepts, identifying important relationships between ideas, and practicing problem-solving techniques related to the material."
              }
            ],
            quizQuestions: [
              {
                question: `What was the primary focus of the "${reviewSession.sessionName}" study session?`,
                options: ["Core educational concepts from uploaded materials", "Unrelated general knowledge", "Random information", "No specific focus"],
                correctAnswer: "Core educational concepts from uploaded materials",
                explanation: "This session was designed to process and learn from the specific educational materials you uploaded, creating targeted study content."
              },
              {
                question: "What is the most effective approach to reviewing study materials?",
                options: ["Skip reviewing entirely", "Review once quickly", "Regular practice with active recall", "Memorize everything word-for-word"],
                correctAnswer: "Regular practice with active recall",
                explanation: "Regular practice combined with active recall techniques helps reinforce learning and improve long-term retention of information."
              }
            ],
            summary: `This study session on "${reviewSession.sessionName}" focused on processing and learning from your uploaded educational materials. The session successfully created a framework for effective studying using various techniques including flashcards for active recall, quiz questions for self-testing, and summary reviews for concept reinforcement. Continue to engage with the materials actively through regular review and practice.`
          });
        }
      } catch (error) {
        console.error('Error loading AI content:', error);
        setHasError(true);
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

  // Check for loading states
  if (isLoadingContent || isGenerating) {
    return (
      <MainLayout>
        <div className="px-4 text-center py-8">
          <p className="text-lg text-gray-600">
            Loading review content...
          </p>
        </div>
      </MainLayout>
    );
  }

  if (hasError) {
    return (
      <MainLayout>
        <div className="px-4 text-center py-8">
          <p className="text-lg text-gray-600">
            Unable to load review content. Please try again later.
          </p>
        </div>
      </MainLayout>
    );
  }

  if (!aiContent || flashcards.length === 0) {
    return (
      <MainLayout>
        <div className="px-4 text-center py-8">
          <p className="text-lg text-gray-600">
            No study materials found for this session.
          </p>
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
    
    // Navigate to home instead of back to the list
    navigate('/home');
  };

  const handleAnswerSelect = (answer: string) => {
    if (!isAnswerSubmitted) {
      setSelectedAnswer(answer);
    }
  };
  
  // Check for missing content in specific steps
  if (currentStep === 'flashcards' && !flashcards[currentCardIndex]) {
    setCurrentStep('quiz');
    return null;
  }

  if (currentStep === 'quiz') {
    if (quizQuestions.length === 0) {
      setCurrentStep('summary');
      return null;
    }

    const currentQuestion = quizQuestions[currentQuestionIndex];
    if (!currentQuestion) {
      setCurrentStep('summary');
      return null;
    }
  }

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
        onFinish={handleFinishReview}
        isReviewSession={true}
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

export default ReviewSessionPage;
