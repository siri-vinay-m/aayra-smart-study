
import React from 'react';
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

const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  onFinish,
  sessionType,
  sessionId,
  quizResponses = []
}) => {
  const calculateScore = () => {
    if (quizResponses.length === 0) return null;
    const correctCount = quizResponses.filter(response => response.isCorrect).length;
    return Math.round((correctCount / quizResponses.length) * 100);
  };

  const score = calculateScore();

  const getButtonText = () => {
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
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4 text-gray-900">Session Summary</h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {summary}
            </p>
          </div>
        </CardContent>
      </Card>

      {score !== null && (
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4 text-gray-900">Quiz Performance</h3>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${
                score >= 80 ? 'text-green-600' : 
                score >= 60 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {score}%
              </div>
              <p className="text-gray-600">
                {quizResponses.filter(r => r.isCorrect).length} out of {quizResponses.length} correct
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {score >= 80 ? 'Excellent work!' : 
                 score >= 60 ? 'Good job! Keep practicing.' : 'Keep studying and try again!'}
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
          {getButtonText()}
        </Button>
      </div>
    </div>
  );
};

export default SummaryView;
