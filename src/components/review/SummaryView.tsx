
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
      // Generate PDF for both new sessions and review sessions
      if (currentSession && currentSession.aiGeneratedContent) {
        console.log('Generating PDF for session completion...', isReviewSession ? `review stage: ${reviewStage}` : 'new session');
        
        const pdfId = await generateSessionPDF(
          currentSession.id,
          currentSession.sessionName,
          currentSession.aiGeneratedContent,
          isReviewSession ? reviewStage : 0
        );
        
        if (pdfId) {
          toast({
            title: isReviewSession ? "Review Complete!" : "Session Complete!",
            description: `Your ${isReviewSession ? 'review' : 'study'} session has been saved as a PDF for future reference.`,
          });
        } else {
          toast({
            title: isReviewSession ? "Review Complete!" : "Session Complete!",
            description: `${isReviewSession ? 'Review' : 'Session'} completed, but PDF generation encountered an issue.`,
            variant: "destructive"
          });
        }
      }

      // Handle review completion if this is a review session
      if (isReviewSession && reviewId && sessionId) {
        await completeReview(reviewId, sessionId);
        toast({
          title: "Review Complete!",
          description: "Great job completing your review session!",
        });
      }

      onFinish();
    } catch (error) {
      console.error('Error in handleFinish:', error);
      toast({
        title: "Error",
        description: "An error occurred while completing the session.",
        variant: "destructive"
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
              {isReviewSession ? 'Completing Review...' : 'Generating PDF...'}
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
