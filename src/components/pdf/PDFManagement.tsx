
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText, Info } from 'lucide-react';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import { useToast } from '@/hooks/use-toast';
import SessionPDFList from './SessionPDFList';

const PDFManagement: React.FC = () => {
  const { updateExistingSessionsPDFs, isGenerating } = usePDFGeneration();
  const { toast } = useToast();

  const handleUpdateExistingSessions = async () => {
    try {
      await updateExistingSessionsPDFs();
      toast({
        title: "Update Complete",
        description: "Existing sessions have been processed for PDF generation.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update existing sessions. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Automatic PDF Generation</p>
                <p className="text-blue-700">
                  PDFs are automatically generated when you complete new study sessions. 
                  For existing sessions completed before this feature, use the button below 
                  to generate PDFs retroactively.
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleUpdateExistingSessions}
              disabled={isGenerating}
              className="flex items-center gap-2"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating PDFs...' : 'Generate PDFs for Existing Sessions'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <SessionPDFList />
    </div>
  );
};

export default PDFManagement;
