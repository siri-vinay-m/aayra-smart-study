
import { useState } from 'react';
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

  const generateAIContentForSession = async (
    sessionId: string,
    sessionName: string
  ): Promise<AIGeneratedContent | null> => {
    setIsGenerating(true);
    
    try {
      // Fetch uploaded materials for this session
      const { data: materials, error } = await supabase
        .from('uploadedmaterials')
        .select('*')
        .eq('sessionid', sessionId);

      if (error) {
        console.error('Error fetching materials:', error);
        return null;
      }

      if (!materials || materials.length === 0) {
        console.log('No materials found for session:', sessionId);
        return null;
      }

      // Convert database materials to AI processing format
      const studyMaterials: StudyMaterial[] = materials.map(material => ({
        id: material.materialid,
        type: material.materialtype as 'text' | 'file' | 'url' | 'voice',
        content: material.contenttext || material.voicetranscript || `File uploaded: ${material.originalfilename}. This is a study material document that needs to be processed for educational content.`,
        filename: material.originalfilename || undefined,
      }));

      // Process materials with AI
      const aiResponse = await processStudyMaterials(studyMaterials, sessionName);
      
      if (!aiResponse) {
        console.error('Failed to generate AI content');
        return null;
      }

      return aiResponse;
    } catch (error) {
      console.error('Error generating AI content:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateAIContentForSession,
    isGenerating,
  };
};
