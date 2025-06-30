
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardViewProps {
  flashcards: Flashcard[];
  currentCardIndex: number;
  onNext: () => void;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({
  flashcards,
  currentCardIndex,
  onNext
}) => {
  const currentCard = flashcards[currentCardIndex];
  const isLastFlashcard = currentCardIndex === flashcards.length - 1;

  return (
    <>
      <div className="text-center mb-4">
        <span className="text-sm text-muted-foreground">
          Flashcard {currentCardIndex + 1} of {flashcards.length}
        </span>
      </div>
      <Card className="mb-6 min-h-[150px] flex flex-col justify-center">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-4">{currentCard.question}</h3>
            <p className="text-foreground">{currentCard.answer}</p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-center">
        <Button
          onClick={onNext}
          className="bg-orange-500 hover:bg-orange-600 px-6 py-3"
        >
          {isLastFlashcard ? 'Start Quiz' : 'Next'}
        </Button>
      </div>
    </>
  );
};

export default FlashcardView;
