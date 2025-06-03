
import { useState } from 'react';

interface ModerationResult {
  isAppropriate: boolean;
  reason?: string;
  category?: string;
}

// Keywords to flag inappropriate content
const INAPPROPRIATE_KEYWORDS = {
  sexual: ['porn', 'nude', 'sex', 'xxx', 'erotic', 'fetish', 'blowjob', 'hentai'],
  abusive: ['stupid', 'idiot', 'dumb', 'hate', 'bitch', 'kill yourself', 'loser', 'asshole', 'fuck you'],
  violent: ['bomb', 'gun', 'shoot', 'stab', 'murder', 'suicide', 'assault', 'blood', 'kill', 'violence'],
  political: ['vote for', 'right wing', 'leftist', 'communist', 'election fraud', 'liberal agenda', 'fascist', 'democrat', 'republican'],
  spam: ['buy now', 'click here', 'subscribe', 'promo', 'discount', 'influencer', 'affiliate', 'sale', 'offer'],
  meme: ['meme', 'lol', 'haha', 'dank', 'troll', 'yolo', 'viral', 'tiktok', 'cringe', 'sus']
};

const RACIAL_SLURS = [
  // Common slurs - in a real implementation, use a comprehensive hate speech dataset
  'nigger', 'spic', 'chink', 'kike', 'wetback', 'raghead', 'gook', 'fag', 'dyke'
];

export const useContentModeration = () => {
  const [isChecking, setIsChecking] = useState(false);

  const checkContent = async (content: string, type: 'text' | 'file' | 'url' | 'voice'): Promise<ModerationResult> => {
    setIsChecking(true);
    
    try {
      // Normalize content for checking
      const normalizedContent = content.toLowerCase().trim();
      
      // Check for racial slurs (highest priority)
      for (const slur of RACIAL_SLURS) {
        if (normalizedContent.includes(slur.toLowerCase())) {
          return {
            isAppropriate: false,
            reason: "This content contains hate speech and has been rejected. Please upload relevant study material.",
            category: "hate_speech"
          };
        }
      }
      
      // Check other inappropriate categories
      for (const [category, keywords] of Object.entries(INAPPROPRIATE_KEYWORDS)) {
        for (const keyword of keywords) {
          if (normalizedContent.includes(keyword.toLowerCase())) {
            return {
              isAppropriate: false,
              reason: "This content is not appropriate for academic purposes and has been rejected. Please upload relevant study material.",
              category
            };
          }
        }
      }
      
      // Check for academic relevance
      if (type === 'text' && normalizedContent.length > 20) {
        const academicKeywords = [
          'study', 'learn', 'education', 'course', 'lesson', 'chapter', 'theory', 'concept',
          'analysis', 'research', 'science', 'mathematics', 'history', 'literature', 'physics',
          'chemistry', 'biology', 'geography', 'economics', 'psychology', 'philosophy',
          'exam', 'test', 'quiz', 'assignment', 'homework', 'project', 'thesis', 'essay',
          'definition', 'explanation', 'example', 'formula', 'equation', 'theorem', 'principle'
        ];
        
        const hasAcademicContent = academicKeywords.some(keyword => 
          normalizedContent.includes(keyword)
        );
        
        // If content is substantial but has no academic keywords, check for coherent educational structure
        if (!hasAcademicContent && normalizedContent.length > 100) {
          // Simple heuristic: academic content usually has proper sentence structure
          const sentences = normalizedContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
          const avgWordsPerSentence = normalizedContent.split(' ').length / sentences.length;
          
          // Academic content typically has longer, more complex sentences
          if (avgWordsPerSentence < 5 || sentences.length < 2) {
            return {
              isAppropriate: false,
              reason: "This content does not appear to be academic material. Please upload relevant study content such as lecture notes, textbook excerpts, or course materials.",
              category: "non_academic"
            };
          }
        }
      }
      
      // Special handling for URLs
      if (type === 'url') {
        const suspiciousUrlPatterns = [
          'social', 'facebook', 'twitter', 'instagram', 'tiktok', 'snapchat',
          'dating', 'shop', 'buy', 'sale', 'porn', 'xxx', 'adult'
        ];
        
        for (const pattern of suspiciousUrlPatterns) {
          if (normalizedContent.includes(pattern)) {
            return {
              isAppropriate: false,
              reason: "This URL does not appear to be an educational resource. Please upload links to academic websites, research papers, or educational materials.",
              category: "inappropriate_url"
            };
          }
        }
      }
      
      return { isAppropriate: true };
      
    } catch (error) {
      console.error('Content moderation error:', error);
      // In case of error, allow content through but log the issue
      return { isAppropriate: true };
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkContent,
    isChecking
  };
};
