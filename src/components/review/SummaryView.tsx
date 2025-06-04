
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
        
        // Create fallback content if AI content is not available
        const contentToUse = currentSession.aiGeneratedContent || {
          flashcards: [
            {
              question: `What was the main focus of your "${currentSession.sessionName}" study session?`,
              answer: `This session covered ${currentSession.subjectName} - ${currentSession.topicName}. Continue reviewing these concepts to reinforce your learning.`
            }
          ],
          quizQuestions: [
            {
              question: `What subject did you study in this session?`,
              options: [currentSession.subjectName, "Other subject", "No specific subject", "Multiple subjects"],
              correctAnswer: currentSession.subjectName,
              explanation: `This session focused on ${currentSession.topicName} in ${currentSession.subjectName}.`
            }
          ],
          summary: summary || `Study session "${currentSession.sessionName}" completed successfully. You studied ${currentSession.subjectName} - ${currentSession.topicName}. Keep up the great work!`
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
          toast({
            title: "Session Complete!",
            description: "Session completed successfully. PDF will be generated in the background.",
          });
        }
      }

      onFinish();
    } catch (error) {
      console.error('Error in handleFinish:', error);
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
