
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
      
      const response = await fetch('/functions/v1/process-study-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      // Check if response has content
      const responseText = await response.text();
      console.log('Response text length:', responseText.length);
      
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
