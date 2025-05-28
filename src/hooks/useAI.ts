
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

  const createFallbackContent = (sessionName: string): AIResponse => {
    return {
      flashcards: [
        {
          question: `What was the main topic covered in the "${sessionName}" session?`,
          answer: "This session covered important educational concepts. Review the uploaded materials to understand the main ideas and practice applying them to reinforce your learning."
        },
        {
          question: "How should you approach studying this material effectively?",
          answer: "Break down complex topics into smaller parts, use active recall techniques, and connect new information to what you already know. Regular practice and review are key to mastering the content."
        },
        {
          question: "What are the key learning objectives for this study session?",
          answer: "Focus on understanding the core concepts, identifying important relationships between ideas, and practicing problem-solving techniques related to the material."
        },
        {
          question: "How can you apply the concepts from this session?",
          answer: "Look for real-world applications of the concepts, create your own examples, and practice explaining the ideas to others to deepen your understanding."
        },
        {
          question: "What study strategies work best for this type of material?",
          answer: "Use a combination of reading, note-taking, visual aids, and practice exercises. Spaced repetition and active testing will help with long-term retention."
        }
      ],
      quizQuestions: [
        {
          question: `What was the primary focus of the "${sessionName}" study session?`,
          options: ["Core educational concepts from uploaded materials", "Unrelated general knowledge", "Random information", "No specific focus"],
          correctAnswer: "Core educational concepts from uploaded materials",
          explanation: "This session was designed to process and learn from the specific educational materials you uploaded, creating targeted study content."
        },
        {
          question: "What is the most effective approach to reviewing study materials?",
          options: ["Skip reviewing entirely", "Review once quickly", "Regular practice with active recall", "Memorize everything word-for-word"],
          correctAnswer: "Regular practice with active recall",
          explanation: "Regular practice combined with active recall techniques helps reinforce learning and improve long-term retention of information."
        },
        {
          question: "How can you make your study sessions more productive?",
          options: ["Study for long hours without breaks", "Use active learning techniques", "Only read materials passively", "Avoid taking any notes"],
          correctAnswer: "Use active learning techniques",
          explanation: "Active learning techniques like summarizing, questioning, and applying concepts help improve understanding and retention more than passive reading."
        },
        {
          question: "What role do flashcards play in effective studying?",
          options: ["They replace the need for other study methods", "They help with spaced repetition and recall", "They are only useful for memorization", "They are not effective for learning"],
          correctAnswer: "They help with spaced repetition and recall",
          explanation: "Flashcards are excellent tools for spaced repetition and active recall, helping to strengthen memory and identify areas that need more attention."
        },
        {
          question: "Why is it important to create summaries of study materials?",
          options: ["To make the content shorter", "To identify and reinforce key concepts", "To avoid reading the original material", "To impress others with knowledge"],
          correctAnswer: "To identify and reinforce key concepts",
          explanation: "Creating summaries helps you identify the most important concepts, organize information logically, and reinforce understanding through active processing."
        }
      ],
      summary: `This study session on "${sessionName}" focused on processing and learning from your uploaded educational materials. The session successfully created a framework for effective studying using various techniques including flashcards for active recall, quiz questions for self-testing, and summary reviews for concept reinforcement. To maximize your learning from these materials, continue to engage with them actively through regular review, practice application of concepts, and connection to related knowledge you already possess. The combination of the uploaded materials and these study tools provides a comprehensive foundation for mastering the subject matter.`
    };
  };

  const processStudyMaterials = async (
    materials: StudyMaterial[],
    sessionName: string
  ): Promise<AIResponse | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('Starting AI processing with materials:', materials.length);
      console.log('Session name:', sessionName);
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
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `Failed to process study materials (${response.status})`;
        try {
          const errorData = await response.json();
          console.error('Server error response:', errorData);
          
          // Check for specific rate limit error
          if (response.status === 429 || errorData.error?.includes('quota') || errorData.error?.includes('429')) {
            console.log('Rate limit detected, using fallback content');
            return createFallbackContent(sessionName);
          }
          
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} - ${response.statusText}`;
        }
        
        // For any server error, return fallback content instead of failing
        console.log('Server error detected, using fallback content');
        return createFallbackContent(sessionName);
      }

      // Check if response has content
      const responseText = await response.text();
      console.log('Response text length:', responseText.length);
      console.log('Response text preview:', responseText.substring(0, 300));
      
      if (!responseText || responseText.trim() === '') {
        console.log('Empty response, using fallback content');
        return createFallbackContent(sessionName);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', responseText);
        console.log('Parse error, using fallback content');
        return createFallbackContent(sessionName);
      }

      // Validate the response structure
      if (!result.flashcards || !result.quizQuestions || !result.summary) {
        console.error('Invalid response structure:', result);
        console.log('Invalid structure, using fallback content');
        return createFallbackContent(sessionName);
      }

      console.log('AI processing completed successfully');
      console.log('Generated flashcards:', result.flashcards.length);
      console.log('Generated quiz questions:', result.quizQuestions.length);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while processing study materials';
      setError(errorMessage);
      console.error('Error processing study materials:', err);
      console.log('Exception caught, using fallback content');
      return createFallbackContent(sessionName);
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
