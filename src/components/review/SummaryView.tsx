
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SummaryViewProps {
  summary: string;
  onFinish: () => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  onFinish
}) => {
  return (
    <Card className="mb-6 min-h-[300px]">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Session Summary</h2>
        <div className="whitespace-pre-line mb-6 text-gray-700">
          {summary}
        </div>
        
        <div className="flex justify-center">
          <Button
            onClick={onFinish}
            className="bg-green-500 hover:bg-green-600 px-6 py-3"
          >
            Take a Break
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryView;
