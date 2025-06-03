
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, Hash } from 'lucide-react';
import { useSessionPDFs } from '@/hooks/useSessionPDFs';
import { useToast } from '@/hooks/use-toast';

const SessionPDFList: React.FC = () => {
  const { sessionPDFs, isLoading, downloadPDF } = useSessionPDFs();
  const { toast } = useToast();

  const handleDownload = async (pdfPath: string, sessionId: string) => {
    try {
      const fileName = `session-${sessionId}-${Date.now()}.pdf`;
      await downloadPDF(pdfPath, fileName);
      toast({
        title: "Download Started",
        description: "Your session PDF is being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading session PDFs...</p>
      </div>
    );
  }

  if (sessionPDFs.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">No session PDFs found.</p>
        <p className="text-sm text-gray-500 mt-2">
          Complete study sessions to generate PDFs automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Session PDFs</h2>
      {sessionPDFs.map((pdf) => (
        <Card key={pdf.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Session Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                Generated: {new Date(pdf.generated_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Hash className="h-4 w-4" />
                Size: {formatFileSize(pdf.pdf_file_size)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="font-medium">Flashcards:</span> {pdf.flashcards_count}
              </div>
              <div>
                <span className="font-medium">Quiz Count:</span> {pdf.quiz_count}
              </div>
            </div>
            
            {pdf.content_summary && (
              <div className="mb-4">
                <p className="text-sm text-gray-700 line-clamp-2">
                  {pdf.content_summary}
                </p>
              </div>
            )}
            
            <Button
              onClick={() => handleDownload(pdf.pdf_file_path, pdf.session_id)}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SessionPDFList;
