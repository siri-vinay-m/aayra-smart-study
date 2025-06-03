
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SessionPDF {
  id: string;
  session_id: string;
  pdf_file_path: string;
  pdf_file_size: number;
  content_summary: string;
  flashcards_count: number;
  quiz_count: string; // Changed from quiz_questions_count to quiz_count and type to string
  generated_at: string;
  created_at: string;
}

export const useSessionPDFs = () => {
  const [sessionPDFs, setSessionPDFs] = useState<SessionPDF[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessionPDFs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('session_pdfs')
        .select(`
          id,
          session_id,
          pdf_file_path,
          pdf_file_size,
          content_summary,
          flashcards_count,
          quiz_count,
          generated_at,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setSessionPDFs(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load session PDFs';
      setError(errorMessage);
      console.error('Error loading session PDFs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = async (pdfPath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('session-pdfs')
        .download(pdfPath);

      if (error) {
        throw error;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadSessionPDFs();
  }, []);

  return {
    sessionPDFs,
    isLoading,
    error,
    loadSessionPDFs,
    downloadPDF
  };
};
