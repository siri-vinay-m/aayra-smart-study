
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizViewProps {
  quizQuestions: QuizQuestion[];
  currentQuestionIndex: number;
  selectedAnswer: string | null;
  isAnswerSubmitted: boolean;
  onAnswerSelect: (answer: string) => void;
  onSubmitAnswer: () => void;
  onNext: () => void;
  onQuizResponse?: (questionIndex: number, selectedAnswer: string, correctAnswer: string) => void;
}

const QuizView: React.FC<QuizViewProps> = ({
  quizQuestions,
  currentQuestionIndex,
  selectedAnswer,
  isAnswerSubmitted,
  onAnswerSelect,
  onSubmitAnswer,
  onNext,
  onQuizResponse
}) => {
  const currentQuestion = quizQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;

  const handleSubmitAnswer = () => {
    onSubmitAnswer();
    
    // Track the quiz response
    if (selectedAnswer && onQuizResponse) {
      onQuizResponse(currentQuestionIndex, selectedAnswer, currentQuestion.correctAnswer);
    }
  };

  return (
    <>
      <div className="text-center mb-4">
        <span className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {quizQuestions.length}
        </span>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              const showCorrect = isAnswerSubmitted && isCorrect;
              const showIncorrect = isAnswerSubmitted && isSelected && !isCorrect;
              
              return (
                <button
                  key={index}
                  onClick={() => onAnswerSelect(option)}
                  disabled={isAnswerSubmitted}
                  className={`w-full p-3 text-left border rounded-lg transition-colors ${
                    showCorrect
                      ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-200'
                      : showIncorrect
                      ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-200'
                      : isSelected
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-800 dark:text-blue-200'
                      : 'bg-card border-border hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          
          {isAnswerSubmitted && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Explanation:</strong> {currentQuestion.explanation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        {!isAnswerSubmitted ? (
          <Button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-3"
          >
            Submit Answer
          </Button>
        ) : (
          <Button
            onClick={onNext}
            className="bg-orange-500 hover:bg-orange-600 px-6 py-3"
          >
            {isLastQuestion ? 'View Summary' : 'Next Question'}
          </Button>
        )}
      </div>
    </>
  );
};

export default QuizView;
