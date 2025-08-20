
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface QuizResponse {
  questionIndex: number;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface SummaryViewProps {
  summary: string;
  onFinish: () => void;
  sessionType: 'completed' | 'pending' | 'new_or_incomplete';
  sessionId?: string;
  quizResponses?: QuizResponse[];
}

const SummaryView: React.FC<SummaryViewProps> = React.memo(({
  summary,
  onFinish,
  sessionType,
  sessionId,
  quizResponses = []
}) => {
  // Memoize score calculation to prevent recalculation on every render
  const { score, correctCount } = useMemo(() => {
    if (quizResponses.length === 0) return { score: null, correctCount: 0 };
    const correct = quizResponses.filter(response => response.isCorrect).length;
    return {
      score: Math.round((correct / quizResponses.length) * 100),
      correctCount: correct
    };
  }, [quizResponses]);

  // Memoize button text to prevent recalculation
  const buttonText = useMemo(() => {
    switch (sessionType) {
      case 'completed':
        return 'Back to Home';
      case 'pending':
        return 'Complete Review';
      case 'new_or_incomplete':
        return 'Take a Break';
      default:
        return 'Continue';
    }
  }, [sessionType]);

  // Memoize score styling
  const scoreStyle = useMemo(() => {
    if (score === null) return '';
    return score >= 80 ? 'text-green-600' : 
           score >= 60 ? 'text-orange-600' : 'text-red-600';
  }, [score]);

  // Memoize encouragement message
  const encouragementMessage = useMemo(() => {
    if (score === null) return '';
    return score >= 80 ? 'Excellent work!' : 
           score >= 60 ? 'Good job! Keep practicing.' : 'Keep studying and try again!';
  }, [score]);

  return (
    <div className="space-y-6">
      <Card className="bg-card border">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4 text-foreground">Session Summary</h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {summary}
            </p>
          </div>
        </CardContent>
      </Card>

      {score !== null && (
        <Card className="bg-card border">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4 text-foreground">Quiz Performance</h3>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${scoreStyle}`}>
                {score}%
              </div>
              <p className="text-muted-foreground">
                {correctCount} out of {quizResponses.length} correct
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {encouragementMessage}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button
          onClick={onFinish}
          className="bg-primary hover:bg-primary/90 px-8 py-3 text-lg text-white"
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
});

export default SummaryView;
