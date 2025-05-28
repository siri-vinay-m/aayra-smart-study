
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

interface QuizViewProps {
  quizQuestions: QuizQuestion[];
  currentQuestionIndex: number;
  selectedAnswer: string | null;
  isAnswerSubmitted: boolean;
  onAnswerSelect: (answer: string) => void;
  onSubmitAnswer: () => void;
  onNext: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({
  quizQuestions,
  currentQuestionIndex,
  selectedAnswer,
  isAnswerSubmitted,
  onAnswerSelect,
  onSubmitAnswer,
  onNext
}) => {
  const currentQuestion = quizQuestions[currentQuestionIndex];

  return (
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
                onClick={() => !isAnswerSubmitted && onAnswerSelect(option)}
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
              <Button onClick={onSubmitAnswer} disabled={!selectedAnswer}>
                Submit Answer
              </Button>
            ) : (
              <Button onClick={onNext}>
                {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'View Summary'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default QuizView;
