
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { AIGeneratedContent, StudySession } from '@/types/session';
import { useAIContentStorage } from '@/hooks/useAIContentStorage';
import FlashcardView from '@/components/review/FlashcardView';
import QuizView from '@/components/review/QuizView';
import SummaryView from '@/components/review/SummaryView';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import ReviewSessionLoading from '@/components/review/ReviewSessionLoading';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ReviewSessionPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { pendingReviews, completedSessions, loadPendingReviews } = useSession();
  const [reviewSession, setReviewSession] = useState<StudySession | null>(null);
  const [aiContent, setAiContent] = useState<AIGeneratedContent | null>(null);
  const [currentStep, setCurrentStep] = useState<'flashcards' | 'quiz' | 'summary'>('flashcards');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizResponses, setQuizResponses] = useState<Array<{
    questionIndex: number;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>>([]);
  const { getAIContent } = useAIContentStorage();
  const contentLoaded = useRef(false);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Check if session is in pending reviews (higher priority)
        const pendingReview = pendingReviews.find(review => review.sessionId === sessionId);
        
        // If not in pending reviews, check if it's a completed session
        const completedSession = completedSessions.find(session => session.id === sessionId);

        if (pendingReview) {
          // Get session details for this review
          const { data, error } = await supabase
            .from('studysessions')
            .select('*')
            .eq('sessionid', sessionId)
            .single();
            
          if (error || !data) {
            console.error('Error fetching session details:', error);
            return;
          }

          const reviewStage = parseInt(pendingReview.reviewStage);
          
          // Format session with review data
          const formattedSession: StudySession = {
            id: data.sessionid,
            sessionName: data.sessionname,
            subjectName: data.subjectname,
            topicName: data.topicname,
            focusDuration: 0,
            breakDuration: 0,
            focusDurationMinutes: data.focusdurationminutes,
            breakDurationMinutes: data.breakdurationminutes,
            status: 'completed',
            startTime: new Date(data.createdat),
            completedAt: data.updatedat ? new Date(data.updatedat) : undefined,
            createdAt: new Date(data.createdat),
            reviewStage: reviewStage
          };
          
          setReviewSession(formattedSession);
          
          // Get AI content for this review stage
          const content = await getAIContent(sessionId, reviewStage);
          if (content) {
            setAiContent(content);
            contentLoaded.current = true;
          }
        } else if (completedSession) {
          // For completed sessions (not in review cycle)
          setReviewSession({
            ...completedSession,
            status: 'completed'
          });
          
          // Get AI content for the main session (stage 0)
          const content = await getAIContent(sessionId, 0);
          if (content) {
            setAiContent(content);
            contentLoaded.current = true;
          }
        }
      } catch (error) {
        console.error('Error loading review session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, pendingReviews, completedSessions, getAIContent]);

  const handleNextCard = () => {
    if (aiContent && aiContent.flashcards && currentCardIndex < aiContent.flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setCurrentStep('quiz');
    }
  };

  const handleQuizResponse = (questionIndex: number, selectedAnswer: string, correctAnswer: string) => {
    const isCorrect = selectedAnswer === correctAnswer;
    
    setQuizResponses(prev => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(r => r.questionIndex === questionIndex);
      if (existingIndex >= 0) {
        updated[existingIndex] = {
          questionIndex,
          selectedAnswer,
          correctAnswer,
          isCorrect
        };
      } else {
        updated.push({
          questionIndex,
          selectedAnswer,
          correctAnswer,
          isCorrect
        });
      }
      return updated;
    });
  };

  const handleAnswerSelect = (answer: string) => {
    if (!isAnswerSubmitted) {
      setSelectedAnswer(answer);
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
    
    if (aiContent && aiContent.quizQuestions && currentQuestionIndex < aiContent.quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentStep('summary');
    }
  };
  
  const handleFinishReview = () => {
    // Just navigate to the validation page to handle the actual completion
    if (reviewSession) {
      navigate(`/validation`, { state: { reviewSession } });
    }
  };

  if (loading) {
    return <ReviewSessionLoading />;
  }

  if (!reviewSession || !contentLoaded.current) {
    // Instead of showing an error screen, use aiContent from the session data
    // This avoids the flash of the error screen
    if (sessionId) {
      // Set the session as a completed session view and continue
      const matchedSession = completedSessions.find(session => session.id === sessionId);
      
      if (matchedSession) {
        // If content hasn't loaded yet but we have the session, wait a bit more
        return <ReviewSessionLoading />;
      }
    }
  }

  // Use content from the AI or fallback to defaults if needed
  const flashcards = aiContent?.flashcards || [
    { question: "No flashcards available for this session", answer: "Please try again later" }
  ];
  
  const quizQuestions = aiContent?.quizQuestions || [
    { 
      question: "No quiz questions available for this session", 
      options: ["Option A", "Option B", "Option C", "Option D"], 
      correctAnswer: "Option A",
      explanation: "This is a placeholder question."
    }
  ];
  
  const summary = aiContent?.summary || "Summary not available for this session.";

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
        onFinish={handleFinishReview}
        isReviewSession={!!(reviewSession?.reviewStage && reviewSession.reviewStage > 0)}
        reviewStage={reviewSession?.reviewStage || 0}
        sessionId={reviewSession?.id}
        quizResponses={quizResponses}
        sessionStatus={reviewSession?.status}
      />
    );
  }

  return (
    <MainLayout>
      <div className="px-4">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
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
    </MainLayout>
  );
};

export default ReviewSessionPage;
