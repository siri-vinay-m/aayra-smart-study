
import { useState, useRef } from 'react';
import { useAI } from '@/hooks/useAI';
import { supabase } from '@/integrations/supabase/client';
import { AIGeneratedContent } from '@/types/session';
import { useAIContentStorage } from '@/hooks/useAIContentStorage';

interface StudyMaterial {
  id: string;
  type: 'text' | 'file' | 'url' | 'voice';
  content: string;
  filename?: string;
}

export const useSessionAI = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { processStudyMaterials } = useAI();
  const { storeAIContent, getAIContent } = useAIContentStorage();
  const generatingSessionsRef = useRef<Set<string>>(new Set());

  const generateAIContentForSession = async (
    sessionId: string,
    sessionName: string,
    reviewStage: number = 0
  ): Promise<AIGeneratedContent | null> => {
    // Prevent duplicate calls for the same session
    const sessionKey = `${sessionId}-${reviewStage}`;
    if (generatingSessionsRef.current.has(sessionKey)) {
      console.log('Already generating content for session:', sessionId, 'stage:', reviewStage);
      return null;
    }
    
    // For review sessions (reviewStage > 0), always generate fresh content
    // For initial sessions (reviewStage = 0), check for existing content
    if (reviewStage === 0) {
      const existingContent = await getAIContent(sessionId, reviewStage);
      if (existingContent) {
        console.log('Found existing AI content for initial session:', sessionId);
        return existingContent;
      }
    } else {
      console.log('Generating fresh AI content for review session:', sessionId, 'stage:', reviewStage);
    }

    generatingSessionsRef.current.add(sessionKey);
    setIsGenerating(true);
    
    try {
      console.log('Fetching materials for session:', sessionId, 'review stage:', reviewStage);
      
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

      // If no materials found, return null to indicate no content should be generated
      if (!materials || materials.length === 0) {
        console.log('No materials found for session, cannot generate AI content');
        return null;
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
        console.log('AI processing failed, no content generated');
        return null;
      }

      console.log('AI content generated successfully based on uploaded materials');
      
      // Store the AI content
      await storeAIContent(sessionId, aiResponse, reviewStage);
      return aiResponse;
    } catch (error) {
      console.error('Error in generateAIContentForSession:', error);
      return null;
    } finally {
      generatingSessionsRef.current.delete(sessionKey);
      setIsGenerating(false);
    }
  };

  return {
    generateAIContentForSession,
    isGenerating,
  };
};
