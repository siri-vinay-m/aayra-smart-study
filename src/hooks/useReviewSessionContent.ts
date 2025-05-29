
import { useState, useEffect, useRef } from 'react';
import { useSessionAI } from '@/hooks/useSessionAI';
import { PendingReview, StudySession, AIGeneratedContent } from '@/contexts/SessionContext';

export const useReviewSessionContent = (
  reviewSession: PendingReview | StudySession | null,
  sessionId: string | undefined
) => {
  const { generateAIContentForSession, isGenerating } = useSessionAI();
  const [aiContent, setAiContent] = useState<AIGeneratedContent | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [hasError, setHasError] = useState(false);
  const hasAttemptedLoad = useRef(false);

  useEffect(() => {
    const loadAndGenerateAIContent = async () => {
      if (!reviewSession || !sessionId || hasAttemptedLoad.current) {
        if (!reviewSession) {
          setIsLoadingContent(false);
          setHasError(true);
        }
        return;
      }
      
      hasAttemptedLoad.current = true;
      setIsLoadingContent(true);
      setHasError(false);
      
      try {
        console.log('Loading AI content for session:', sessionId, reviewSession.sessionName);
        
        const generatedContent = await generateAIContentForSession(sessionId, reviewSession.sessionName);
        
        if (generatedContent) {
          console.log('AI content loaded successfully');
          setAiContent(generatedContent);
        } else {
          console.log('AI content generation failed, using default content');
          setAiContent({
            flashcards: [
              {
                question: `What was the main topic covered in the "${reviewSession.sessionName}" session?`,
                answer: "This session covered important educational concepts. Review the uploaded materials to understand the main ideas and practice applying them to reinforce your learning."
              },
              {
                question: "What are the key learning objectives for this study session?",
                answer: "Focus on understanding the core concepts, identifying important relationships between ideas, and practicing problem-solving techniques related to the material."
              }
            ],
            quizQuestions: [
              {
                question: `What was the primary focus of the "${reviewSession.sessionName}" study session?`,
                options: ["Core educational concepts from uploaded materials", "Unrelated general knowledge", "Random information", "No specific focus"],
                correctAnswer: "Core educational concepts from uploaded materials",
                explanation: "This session was designed to process and learn from the specific educational materials you uploaded, creating targeted study content."
              },
              {
                question: "What is the most effective approach to reviewing study materials?",
                options: ["Skip reviewing entirely", "Review once quickly", "Regular practice with active recall", "Memorize everything word-for-word"],
                correctAnswer: "Regular practice with active recall",
                explanation: "Regular practice combined with active recall techniques helps reinforce learning and improve long-term retention of information."
              }
            ],
            summary: `This study session on "${reviewSession.sessionName}" focused on processing and learning from your uploaded educational materials. The session successfully created a framework for effective studying using various techniques including flashcards for active recall, quiz questions for self-testing, and summary reviews for concept reinforcement. Continue to engage with the materials actively through regular review and practice.`
          });
        }
      } catch (error) {
        console.error('Error loading AI content:', error);
        setHasError(true);
      } finally {
        setIsLoadingContent(false);
      }
    };

    loadAndGenerateAIContent();
  }, [sessionId, reviewSession?.sessionName]);

  return {
    aiContent,
    isLoadingContent: isLoadingContent || isGenerating,
    hasError
  };
};
