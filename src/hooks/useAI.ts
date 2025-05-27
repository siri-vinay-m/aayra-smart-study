
import { useState } from 'react';

interface StudyMaterial {
  id: string;
  type: 'text' | 'file' | 'url' | 'voice';
  content: string;
  filename?: string;
}

interface AIResponse {
  flashcards: Array<{
    question: string;
    answer: string;
  }>;
  quizQuestions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
  summary: string;
}

export const useAI = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processStudyMaterials = async (
    materials: StudyMaterial[],
    sessionName: string
  ): Promise<AIResponse | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('Starting AI processing with materials:', materials.length);
      console.log('Materials:', materials);
      
      // Use the correct Supabase edge function URL
      const response = await fetch('https://ouyilgvqbwcekkajrrug.supabase.co/functions/v1/process-study-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91eWlsZ3ZxYndjZWtrYWpycnVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NzU4MzgsImV4cCI6MjA2MzU1MTgzOH0.HPv36VVU0WpAXidt2ZrjzUSuiNPCMaXk2tI8SryitbE`,
        },
        body: JSON.stringify({
          materials,
          sessionName,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        let errorMessage = 'Failed to process study materials';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} - ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Check if response has content
      const responseText = await response.text();
      console.log('Response text length:', responseText.length);
      console.log('Response text preview:', responseText.substring(0, 200));
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from server');
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', responseText);
        throw new Error('Invalid response format from server');
      }

      // Validate the response structure
      if (!result.flashcards || !result.quizQuestions || !result.summary) {
        console.error('Invalid response structure:', result);
        throw new Error('Invalid response structure from server');
      }

      console.log('AI processing completed successfully');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error processing study materials:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processStudyMaterials,
    isProcessing,
    error,
  };
};
