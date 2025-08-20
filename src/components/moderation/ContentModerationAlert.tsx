
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContentModerationAlertProps {
  reason: string;
  category: string;
  onDismiss: () => void;
}

const ContentModerationAlert: React.FC<ContentModerationAlertProps> = ({
  reason,
  category,
  onDismiss
}) => {
  const getAlertVariant = (): "default" | "destructive" => {
    if (category === 'hate_speech') return 'destructive';
    return 'destructive';
  };

  const getTitle = () => {
    switch (category) {
      case 'hate_speech':
        return 'Content Rejected - Hate Speech Detected';
      case 'sexual':
        return 'Content Rejected - Inappropriate Material';
      case 'violent':
        return 'Content Rejected - Violent Content';
      case 'political':
        return 'Content Rejected - Political Content';
      case 'non_academic':
        return 'Content Rejected - Not Academic Material';
      case 'inappropriate_url':
        return 'Content Rejected - Invalid URL';
      default:
        return 'Content Rejected';
    }
  };

  return (
    <Alert variant={getAlertVariant()} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <div className="flex justify-between items-start w-full">
        <div>
          <div className="font-semibold mb-1">{getTitle()}</div>
          <AlertDescription>{reason}</AlertDescription>
          <div className="mt-2 text-sm text-muted-foreground">
            <strong>Accepted content includes:</strong>
            <ul className="list-disc list-inside mt-1">
              <li>Lecture notes and course materials</li>
              <li>Textbook excerpts and academic articles</li>
              <li>Educational videos and documents</li>
              <li>Research papers and study guides</li>
              <li>Exam preparation materials</li>
            </ul>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDismiss}
          className="p-1 h-auto"
        >
          <X size={16} />
        </Button>
      </div>
    </Alert>
  );
};

export default ContentModerationAlert;
