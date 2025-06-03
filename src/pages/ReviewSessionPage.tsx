import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import FlashcardView from '@/components/review/FlashcardView';
import QuizView from '@/components/review/QuizView';
import SummaryView from '@/components/review/SummaryView';
import ReviewSessionLoading from '@/components/review/ReviewSessionLoading';
import ReviewSessionError from '@/components/review/ReviewSessionError';
import { useReviewSessionContent } from '@/hooks/useReviewSessionContent';
import { useReviewSessionNavigation } from '@/hooks/useReviewSessionNavigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PendingReview } from '@/types/session';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ReviewSessionPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { setCurrentSession } = useSession();
  const [reviewSession, setReviewSession] = useState<PendingReview | null>(null);
  const [reviewStage, setReviewStage] = useState<number>(1);
  const [currentStep, setCurrentStep] = useState<'flashcards' | 'quiz' | 'summary'>('flashcards');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  
  const { aiContent, isLoadingContent, hasError } = useReviewSessionContent(reviewSession, sessionId);
  
  const {
    showNavigationDialog,
    handleNavigationAttempt,
    handleConfirmNavigation,
    handleCancelNavigation,
  } = useReviewSessionNavigation();

  useEffect(() => {
    const loadReviewSession = async () => {
      if (!sessionId) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Get review cycle entry for this session - get the most recent one
        const { data: reviewEntry, error: reviewError } = await supabase
          .from('reviewcycleentries')
          .select('*')
          .eq('sessionid', sessionId)
          .eq('userid', user.id)
          .eq('status', 'pending')
          .order('createdat', { ascending: false })
          .limit(1)
          .single();

        if (reviewError || !reviewEntry) {
          console.error('Review entry not found:', reviewError);
          navigate('/pending-reviews');
          return;
        }

        // Get session details
        const { data: sessionData, error: sessionError } = await supabase
          .from('studysessions')
          .select('*')
          .eq('sessionid', sessionId)
          .single();

        if (sessionError || !sessionData) {
          console.error('Session not found:', sessionError);
          navigate('/pending-reviews');
          return;
        }

        const pendingReview: PendingReview = {
          id: reviewEntry.entryid,
          sessionId: sessionData.sessionid,
          sessionName: sessionData.sessionname,
          subjectName: sessionData.subjectname,
          topicName: sessionData.topicname,
          completedAt: new Date(sessionData.lastreviewedat || sessionData.createdat),
          dueDate: new Date(reviewEntry.currentreviewduedate),
          reviewStage: `Stage ${reviewEntry.reviewstage}`
        };

        setReviewSession(pendingReview);
        setReviewStage(reviewEntry.reviewstage);
        
        // Set up the current session for PDF generation
        setCurrentSession({
          id: sessionData.sessionid,
          sessionName: sessionData.sessionname,
          subjectName: sessionData.subjectname,
          topicName: sessionData.topicname,
          focusDuration: sessionData.focusdurationminutes * 60,
          breakDuration: sessionData.breakdurationminutes * 60,
          focusDurationMinutes: sessionData.focusdurationminutes,
          breakDurationMinutes: sessionData.breakdurationminutes,
          status: 'completed',
          startTime: new Date(sessionData.createdat),
          createdAt: new Date(sessionData.createdat),
          isFavorite: sessionData.isfavorite || false,
          aiGeneratedContent: null // Will be populated by useReviewSessionContent
        });

      } catch (error) {
        console.error('Error loading review session:', error);
        navigate('/pending-reviews');
      }
    };

    loadReviewSession();
  }, [sessionId, navigate, setCurrentSession]);

  // Update current session with AI content when it's loaded
  useEffect(() => {
    if (aiContent && reviewSession) {
      const updatedSession = {
        id: reviewSession.sessionId,
        sessionName: reviewSession.sessionName,
        subjectName: reviewSession.subjectName,
        topicName: reviewSession.topicName,
        focusDuration: 25 * 60, // Default 25 minutes
        breakDuration: 5 * 60, // Default 5 minutes
        focusDurationMinutes: 25,
        breakDurationMinutes: 5,
        status: 'completed' as const,
        startTime: reviewSession.completedAt,
        createdAt: reviewSession.completedAt,
        isFavorite: false,
        aiGeneratedContent: aiContent
      };
      setCurrentSession(updatedSession);
    }
  }, [aiContent, reviewSession, setCurrentSession]);

  const handleBackButton = () => {
    if (currentStep !== 'summary') {
      handleNavigationAttempt('/pending-reviews');
    } else {
      navigate('/pending-reviews');
    }
  };
  
  const handleNextCard = () => {
    if (!aiContent?.flashcards) return;
    
    if (currentCardIndex < aiContent.flashcards.length - 1) {
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
    
    if (!aiContent?.quizQuestions) return;
    
    if (currentQuestionIndex < aiContent.quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentStep('summary');
    }
  };
  
  const handleFinishReview = () => {
    navigate('/pending-reviews');
  };

  const handleAnswerSelect = (answer: string) => {
    if (!isAnswerSubmitted) {
      setSelectedAnswer(answer);
    }
  };

  if (isLoadingContent) {
    return (
      <MainLayout>
        <ReviewSessionLoading />
      </MainLayout>
    );
  }

  if (hasError || !reviewSession || !aiContent) {
    return (
      <MainLayout>
        <ReviewSessionError 
          message="Unable to load review session. Please try again."
          onRetry={() => window.location.reload()} 
        />
      </MainLayout>
    );
  }
  
  let pageContent;

  if (currentStep === 'flashcards') {
    pageContent = (
      <FlashcardView
        flashcards={aiContent.flashcards}
        currentCardIndex={currentCardIndex}
        onNext={handleNextCard}
      />
    );
  } else if (currentStep === 'quiz') {
    pageContent = (
      <QuizView
        quizQuestions={aiContent.quizQuestions}
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
        summary={aiContent.summary}
        onFinish={handleFinishReview}
        isReviewSession={true}
        reviewId={reviewSession.id}
        sessionId={reviewSession.sessionId}
        reviewStage={reviewStage}
      />
    );
  }
  
  return (
    <MainLayout>
      <div className="px-4">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={handleBackButton}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-center flex-1">
            {currentStep === 'flashcards' ? 'Review Flashcards' : 
             currentStep === 'quiz' ? 'Knowledge Check' : 'Review Summary'}
            {reviewStage > 0 && (
              <span className="text-sm text-gray-500 block">Stage {reviewStage}</span>
            )}
          </h1>
          <div className="w-16" />
        </div>
        {pageContent}
      </div>

      <Dialog open={showNavigationDialog} onOpenChange={handleCancelNavigation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Review Session?</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this review session? Your progress will not be saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelNavigation}>
              Stay
            </Button>
            <Button onClick={handleConfirmNavigation}>
              Leave Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ReviewSessionPage;
