
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SubmitSectionProps {
  onSubmit: () => void;
  isProcessing: boolean;
  hasUploadedContent: boolean;
}

const SubmitSection: React.FC<SubmitSectionProps> = ({
  onSubmit,
  isProcessing,
  hasUploadedContent
}) => {
  return (
    <div className="mt-8">
      <Button
        onClick={onSubmit}
        disabled={!hasUploadedContent || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Submit to AI'
        )}
      </Button>
      
      {!hasUploadedContent && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          Please upload at least one image or record a voice note to continue
        </p>
      )}
    </div>
  );
};

export default SubmitSection;
