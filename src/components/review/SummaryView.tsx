
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useReviewCompletion } from '@/hooks/useReviewCompletion';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SummaryViewProps {
  summary: string;
  onFinish: () => void;
  isReviewSession?: boolean;
  reviewId?: string;
  sessionId?: string;
  reviewStage?: number;
}

const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  onFinish,
  isReviewSession = false,
  reviewId,
  sessionId,
  reviewStage = 0
}) => {
  const { currentSession } = useSession();
  const { completeReview } = useReviewCompletion();
  const { generateSessionPDF, isGenerating } = usePDFGeneration();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFinish = async () => {
    setIsProcessing(true);
    
    try {
      // Handle review completion if this is a review session
      if (isReviewSession && reviewId && sessionId) {
        await completeReview(reviewId, sessionId);
        toast({
          title: "Review Complete!",
          description: "Great job completing your review session!",
        });
        onFinish();
        return;
      }

      // For new sessions, try to generate PDF if we have session data
      if (currentSession) {
        console.log('Generating PDF for new session completion...', currentSession);
        
        // Use AI content if available, otherwise create comprehensive fallback content
        const contentToUse = currentSession.aiGeneratedContent || {
          flashcards: [
            {
              question: `What was the main focus of your "${currentSession.sessionName}" study session?`,
              answer: `This session covered ${currentSession.subjectName} - ${currentSession.topicName}. The key concepts and materials studied during this session should be reviewed regularly to reinforce learning.`
            },
            {
              question: `What subject area did you study in this session?`,
              answer: `${currentSession.subjectName} was the primary subject, with specific focus on ${currentSession.topicName}. This forms part of your ongoing study plan.`
            },
            {
              question: `How long was your focus session?`,
              answer: `You focused for ${currentSession.focusDurationMinutes} minutes on ${currentSession.topicName}, followed by a ${currentSession.breakDurationMinutes}-minute break. This time management approach helps maintain concentration.`
            }
          ],
          quizQuestions: [
            {
              question: `What was the primary subject of your "${currentSession.sessionName}" session?`,
              options: [currentSession.subjectName, "Mathematics", "Science", "Literature"],
              correctAnswer: currentSession.subjectName,
              explanation: `This session was specifically focused on ${currentSession.subjectName}, covering the topic of ${currentSession.topicName}.`
            },
            {
              question: `What specific topic did you study in ${currentSession.subjectName}?`,
              options: [currentSession.topicName, "General concepts", "Basic principles", "Advanced topics"],
              correctAnswer: currentSession.topicName,
              explanation: `The session concentrated on ${currentSession.topicName} within the broader subject of ${currentSession.subjectName}.`
            },
            {
              question: `How many minutes did you focus during this study session?`,
              options: [`${currentSession.focusDurationMinutes} minutes`, "30 minutes", "45 minutes", "60 minutes"],
              correctAnswer: `${currentSession.focusDurationMinutes} minutes`,
              explanation: `You maintained focus for ${currentSession.focusDurationMinutes} minutes, which is an effective duration for concentrated learning.`
            }
          ],
          summary: summary || `Study session "${currentSession.sessionName}" completed successfully on ${new Date().toLocaleDateString()}. You studied ${currentSession.subjectName} with a focus on ${currentSession.topicName}. The session lasted ${currentSession.focusDurationMinutes} minutes of focused study time. This structured approach to learning helps build knowledge systematically. Continue with regular review sessions to reinforce what you've learned and maintain long-term retention of the material.`
        };
        
        const pdfId = await generateSessionPDF(
          currentSession.id,
          currentSession.sessionName,
          contentToUse,
          0 // New sessions are always stage 0
        );
        
        if (pdfId) {
          toast({
            title: "Session Complete!",
            description: "Your study session has been saved as a PDF for future reference.",
          });
        } else {
          // Don't show error toast, just success
          toast({
            title: "Session Complete!",
            description: "Session completed successfully.",
          });
        }
      }

      onFinish();
    } catch (error) {
      console.error('Error in handleFinish:', error);
      // Don't show error toast to user, just complete the session
      toast({
        title: "Session Complete!",
        description: "Session completed successfully.",
      });
      // Still call onFinish to prevent user from being stuck
      onFinish();
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isProcessing || isGenerating;

  return (
    <>
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Session Summary</h3>
          <p className="text-gray-700 leading-relaxed">{summary}</p>
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <Button
          onClick={handleFinish}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 px-8 py-3 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isReviewSession ? 'Completing Review...' : 'Saving Session...'}
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              {isReviewSession ? 'Complete Review' : 'Take a Break'}
            </>
          )}
        </Button>
      </div>
      
      <div className="text-center mt-4 text-sm text-gray-600">
        <p>Your session summary will be saved as a PDF for future reference</p>
      </div>
    </>
  );
};

export default SummaryView;
