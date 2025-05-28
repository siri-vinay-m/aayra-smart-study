
import { useState, useRef } from 'react';
import { useAI } from '@/hooks/useAI';
import { supabase } from '@/integrations/supabase/client';
import { AIGeneratedContent } from '@/contexts/SessionContext';

interface StudyMaterial {
  id: string;
  type: 'text' | 'file' | 'url' | 'voice';
  content: string;
  filename?: string;
}

export const useSessionAI = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { processStudyMaterials } = useAI();
  const generatingSessionsRef = useRef<Set<string>>(new Set());

  const generateAIContentForSession = async (
    sessionId: string,
    sessionName: string
  ): Promise<AIGeneratedContent | null> => {
    // Prevent duplicate calls for the same session
    if (generatingSessionsRef.current.has(sessionId)) {
      console.log('Already generating content for session:', sessionId);
      return null;
    }

    generatingSessionsRef.current.add(sessionId);
    setIsGenerating(true);
    
    try {
      console.log('Fetching materials for session:', sessionId);
      
      // Fetch uploaded materials for this session
      const { data: materials, error } = await supabase
        .from('uploadedmaterials')
        .select('*')
        .eq('sessionid', sessionId);

      if (error) {
        console.error('Error fetching materials:', error);
        return null;
      }

      console.log('Materials found:', materials?.length || 0);

      // If no materials found, create default content
      if (!materials || materials.length === 0) {
        console.log('No materials found, creating default content');
        const defaultContent = {
          flashcards: [
            {
              question: `What was the main topic covered in the "${sessionName}" session?`,
              answer: "This session was created to help you study effectively. Use active recall and spaced repetition to improve your learning outcomes."
            },
            {
              question: "How can you make the most of your study sessions?",
              answer: "Focus on understanding core concepts, practice regularly, and connect new information to what you already know."
            }
          ],
          quizQuestions: [
            {
              question: `What was the primary goal of the "${sessionName}" study session?`,
              options: ["Effective learning and retention", "Passive reading", "Memorization only", "Time filling"],
              correctAnswer: "Effective learning and retention",
              explanation: "The goal of any study session should be to actively engage with material for better understanding and retention."
            }
          ],
          summary: `This study session "${sessionName}" was designed to help you practice effective learning techniques. Continue to use active study methods and regular review to maximize your learning potential.`
        };
        return defaultContent;
      }

      // Convert database materials to AI processing format
      const studyMaterials: StudyMaterial[] = materials.map(material => ({
        id: material.materialid,
        type: material.materialtype as 'text' | 'file' | 'url' | 'voice',
        content: material.contenttext || material.voicetranscript || `File uploaded: ${material.originalfilename}. This is a study material document that needs to be processed for educational content.`,
        filename: material.originalfilename || undefined,
      }));

      console.log('Processing materials with AI:', studyMaterials.length);

      // Process materials with AI - this now has built-in fallback handling
      const aiResponse = await processStudyMaterials(studyMaterials, sessionName);
      
      if (!aiResponse) {
        console.log('AI processing failed, creating fallback content');
        // Create fallback content if AI processing completely fails
        const fallbackContent = {
          flashcards: [
            {
              question: `What materials were studied in the "${sessionName}" session?`,
              answer: "This session included uploaded study materials. Review them carefully and practice active recall techniques."
            }
          ],
          quizQuestions: [
            {
              question: `What type of materials were uploaded for the "${sessionName}" session?`,
              options: ["Study documents and materials", "Random files", "Empty content", "No materials"],
              correctAnswer: "Study documents and materials",
              explanation: "The session included educational materials that you uploaded for studying."
            }
          ],
          summary: `The "${sessionName}" session included your uploaded study materials. Continue to review and practice with these materials for better learning outcomes.`
        };
        return fallbackContent;
      }

      console.log('AI content generated successfully');
      return aiResponse;
    } catch (error) {
      console.error('Error in generateAIContentForSession:', error);
      return null;
    } finally {
      generatingSessionsRef.current.delete(sessionId);
      setIsGenerating(false);
    }
  };

  return {
    generateAIContentForSession,
    isGenerating,
  };
};
