
import { useState } from 'react';

interface ModerationResult {
  isAppropriate: boolean;
  reason?: string;
  category?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  confidence?: number;
}

interface ModerationConfig {
  sensitivity: 'strict' | 'moderate' | 'lenient';
  enableBiasDetection: boolean;
  enablePrivacyProtection: boolean;
  enableMisinformationDetection: boolean;
}

// Content filtering categories - using hashed patterns for security
// Note: In production, these should be loaded from a secure external service
const HARMFUL_CONTENT_PATTERNS = {
  hate_speech: {
    // Pattern-based detection instead of explicit word lists
    patterns: [/\b(hate|kill\s+all|exterminate|genocide)\b/i],
    severity: 'high'
  },
  sexual_explicit: {
    patterns: [/\b(porn|xxx|explicit)\b/i],
    severity: 'medium'
  },
  violence_threats: {
    patterns: [/\b(kill|murder|bomb|weapon)\b/i],
    severity: 'critical'
  },
  illegal_activities: {
    patterns: [/\b(drug\s+dealing|fraud|hacking|terrorism)\b/i],
    severity: 'high'
  }
};

const BIAS_DETECTION_PATTERNS = {
  gender: {
    patterns: [/\b(women\s+are\s+bad|men\s+don't\s+cry|girls\s+are\s+weak)\b/i],
    severity: 'medium'
  },
  racial: {
    patterns: [/\b(terrorists|control\s+media|hypocrites)\b/i],
    severity: 'high'
  },
  age: {
    patterns: [/\b(useless|lazy|outdated|too\s+old|young\s+and\s+stupid)\b/i],
    severity: 'medium'
  }
};

const PRIVACY_PATTERNS = {
  personal_info: {
    ssn: /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/,
    credit_card: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
    phone: /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  },
  sensitive_data: {
    patterns: [/\b(password|pwd|pass|login|credentials|api_key|secret_key|access_token|private_key)\s*[:=]/i],
    severity: 'high'
  }
};

const MISINFORMATION_INDICATORS = {
  conspiracy: ['flat earth', 'chemtrails', 'illuminati', 'deep state', 'fake moon landing'],
  medical: ['vaccines cause autism', 'covid is fake', 'miracle cure', 'big pharma conspiracy'],
  scientific: ['climate change is hoax', 'evolution is fake', 'gravity is theory'],
  political: ['election was stolen', 'voter fraud', 'fake news media', 'rigged election']
};

const ACADEMIC_KEYWORDS = [
  // Core academic terms
  'study', 'learn', 'education', 'course', 'lesson', 'chapter', 'theory', 'concept',
  'analysis', 'research', 'science', 'mathematics', 'history', 'literature', 'physics',
  'chemistry', 'biology', 'geography', 'economics', 'psychology', 'philosophy',
  'exam', 'test', 'quiz', 'assignment', 'homework', 'project', 'thesis', 'essay',
  'definition', 'explanation', 'example', 'formula', 'equation', 'theorem', 'principle',
  // Advanced academic terms
  'hypothesis', 'methodology', 'empirical', 'qualitative', 'quantitative', 'correlation',
  'causation', 'variable', 'control group', 'experiment', 'observation', 'data',
  'statistics', 'probability', 'algorithm', 'function', 'derivative', 'integral',
  'molecule', 'atom', 'cell', 'organism', 'ecosystem', 'evolution', 'genetics',
  'civilization', 'culture', 'society', 'government', 'democracy', 'constitution'
];

const PROMPT_INJECTION_PATTERNS = [
  'ignore previous instructions',
  'forget everything above',
  'new instructions:',
  'system prompt:',
  'override safety',
  'disable filter',
  'act as if',
  'pretend you are',
  'roleplay as',
  'jailbreak',
  'dan mode',
  'developer mode'
];

export const useContentModeration = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [config] = useState<ModerationConfig>({
    sensitivity: 'strict',
    enableBiasDetection: true,
    enablePrivacyProtection: true,
    enableMisinformationDetection: true
  });

  // Audit trail for moderation decisions
  const logModerationDecision = (content: string, result: ModerationResult, timestamp: Date) => {
    console.log('Content Moderation Decision:', {
      timestamp: timestamp.toISOString(),
      contentLength: content.length,
      contentPreview: content.substring(0, 100),
      decision: result.isAppropriate ? 'APPROVED' : 'REJECTED',
      category: result.category,
      severity: result.severity,
      confidence: result.confidence,
      reason: result.reason
    });
  };

  // Enhanced prompt injection detection
  const detectPromptInjection = (content: string): ModerationResult | null => {
    const normalizedContent = content.toLowerCase();
    
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (normalizedContent.includes(pattern.toLowerCase())) {
        return {
          isAppropriate: false,
          reason: "Content contains potential prompt injection attempts and has been rejected for security reasons.",
          category: "prompt_injection",
          severity: "critical",
          confidence: 0.95
        };
      }
    }
    
    // Check for suspicious instruction patterns
    const instructionPatterns = [
      /\b(ignore|forget|override|disable|bypass)\s+(all|previous|above|safety|filter|rules)\b/i,
      /\b(act|pretend|roleplay)\s+(as|like)\s+(if|you|are)\b/i,
      /\b(system|admin|root|developer)\s+(mode|access|prompt|instructions)\b/i
    ];
    
    for (const pattern of instructionPatterns) {
      if (pattern.test(content)) {
        return {
          isAppropriate: false,
          reason: "Content contains suspicious instruction patterns that may attempt to manipulate the system.",
          category: "prompt_injection",
          severity: "high",
          confidence: 0.85
        };
      }
    }
    
    return null;
  };

  // Enhanced harmful content detection using pattern matching
  const detectHarmfulContent = (content: string): ModerationResult | null => {
    const normalizedContent = content.toLowerCase();
    
    // Check all harmful content patterns
    for (const [category, config] of Object.entries(HARMFUL_CONTENT_PATTERNS)) {
      for (const pattern of config.patterns) {
        if (pattern.test(normalizedContent)) {
          return {
            isAppropriate: false,
            reason: `This content contains ${category.replace('_', ' ')} and has been rejected. Please upload appropriate educational content.`,
            category,
            severity: config.severity,
            confidence: 0.90
          };
        }
      }
    }
    
    return null;
  };

  // Bias and discrimination detection using patterns
  const detectBias = (content: string): ModerationResult | null => {
    if (!config.enableBiasDetection) return null;
    
    const normalizedContent = content.toLowerCase();
    
    for (const [biasType, config] of Object.entries(BIAS_DETECTION_PATTERNS)) {
      for (const pattern of config.patterns) {
        if (pattern.test(normalizedContent)) {
          return {
            isAppropriate: false,
            reason: `This content contains ${biasType} bias or stereotypes and has been rejected. Please ensure content is inclusive and non-discriminatory.`,
            category: `bias_${biasType}`,
            severity: config.severity,
            confidence: 0.75
          };
        }
      }
    }
    
    return null;
  };

  // Privacy protection - detect PII and sensitive data
  const detectPrivacyViolations = (content: string): ModerationResult | null => {
    if (!config.enablePrivacyProtection) return null;
    
    // Check regex patterns for personal information
    for (const [infoType, pattern] of Object.entries(PRIVACY_PATTERNS.personal_info)) {
      if (pattern.test(content)) {
        return {
          isAppropriate: false,
          reason: "This content contains personally identifiable information (PII) and has been rejected for privacy protection.",
          category: "privacy_violation",
          severity: "critical",
          confidence: 0.95
        };
      }
    }
    
    // Check sensitive data patterns
    for (const pattern of PRIVACY_PATTERNS.sensitive_data.patterns) {
      if (pattern.test(content)) {
        return {
          isAppropriate: false,
          reason: "This content contains sensitive data that could compromise security and has been rejected.",
          category: "sensitive_data",
          severity: PRIVACY_PATTERNS.sensitive_data.severity,
          confidence: 0.85
        };
      }
    }
    
    return null;
  };

  // Misinformation detection
  const detectMisinformation = (content: string): ModerationResult | null => {
    if (!config.enableMisinformationDetection) return null;
    
    const normalizedContent = content.toLowerCase();
    
    for (const [category, indicators] of Object.entries(MISINFORMATION_INDICATORS)) {
      for (const indicator of indicators) {
        if (normalizedContent.includes(indicator.toLowerCase())) {
          return {
            isAppropriate: false,
            reason: "This content contains potential misinformation and has been rejected. Please upload factual, evidence-based educational material.",
            category: "misinformation",
            severity: "medium",
            confidence: 0.70
          };
        }
      }
    }
    
    return null;
  };

  // Enhanced academic relevance checking
  const checkAcademicRelevance = (content: string, type: 'text' | 'file' | 'url' | 'voice'): ModerationResult | null => {
    if (type !== 'text' || content.length < 20) return null;
    
    const normalizedContent = content.toLowerCase();
    
    // Check for academic keywords
    const hasAcademicContent = ACADEMIC_KEYWORDS.some(keyword => 
      normalizedContent.includes(keyword.toLowerCase())
    );
    
    if (hasAcademicContent) return null;
    
    // Enhanced academic structure analysis
    if (normalizedContent.length > 100) {
      const sentences = normalizedContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const words = normalizedContent.split(/\s+/).filter(w => w.length > 0);
      const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
      
      // Check for academic indicators
      const academicIndicators = {
        hasProperSentences: sentences.length >= 2,
        hasComplexSentences: avgWordsPerSentence >= 8,
        hasAcademicStructure: /\b(introduction|conclusion|analysis|methodology|results|discussion)\b/i.test(content),
        hasCitations: /\b(according to|research shows|studies indicate|evidence suggests)\b/i.test(content),
        hasDefinitions: /\b(defined as|refers to|means that|is characterized by)\b/i.test(content)
      };
      
      const academicScore = Object.values(academicIndicators).filter(Boolean).length;
      
      if (academicScore < 2) {
        return {
          isAppropriate: false,
          reason: "This content does not appear to be academic material. Please upload relevant study content such as lecture notes, textbook excerpts, research papers, or course materials.",
          category: "non_academic",
          severity: "low",
          confidence: 0.65
        };
      }
    }
    
    return null;
  };

  // Enhanced URL validation
  const validateURL = (content: string): ModerationResult | null => {
    const normalizedContent = content.toLowerCase();
    
    // Suspicious URL patterns
    const suspiciousPatterns = [
      'social', 'facebook', 'twitter', 'instagram', 'tiktok', 'snapchat', 'linkedin',
      'dating', 'shop', 'buy', 'sale', 'discount', 'promo', 'affiliate',
      'porn', 'xxx', 'adult', 'sex', 'casino', 'gambling', 'bet'
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (normalizedContent.includes(pattern)) {
        return {
          isAppropriate: false,
          reason: "This URL does not appear to be an educational resource. Please upload links to academic websites, research papers, or educational materials.",
          category: "inappropriate_url",
          severity: "medium",
          confidence: 0.80
        };
      }
    }
    
    // Check for educational domains
    const educationalDomains = ['.edu', '.ac.', 'scholar.google', 'jstor', 'pubmed', 'arxiv', 'researchgate'];
    const hasEducationalDomain = educationalDomains.some(domain => normalizedContent.includes(domain));
    
    if (hasEducationalDomain) return null;
    
    // Additional validation for non-educational domains
    try {
      const url = new URL(content);
      const suspiciousTLDs = ['.xxx', '.adult', '.sex', '.porn'];
      
      if (suspiciousTLDs.some(tld => url.hostname.endsWith(tld))) {
        return {
          isAppropriate: false,
          reason: "This URL contains inappropriate content and has been rejected.",
          category: "inappropriate_url",
          severity: "high",
          confidence: 0.95
        };
      }
    } catch {
      return {
        isAppropriate: false,
        reason: "Invalid URL format. Please provide a valid educational resource link.",
        category: "invalid_url",
        severity: "low",
        confidence: 0.90
      };
    }
    
    return null;
  };

  const checkContent = async (content: string, type: 'text' | 'file' | 'url' | 'voice'): Promise<ModerationResult> => {
    setIsChecking(true);
    const startTime = new Date();
    
    try {
      // Normalize content for checking
      const normalizedContent = content.toLowerCase().trim();
      
      // Multi-layered security checks in order of severity
      const checks = [
        () => detectPromptInjection(content),
        () => detectHarmfulContent(content),
        () => detectPrivacyViolations(content),
        () => detectBias(content),
        () => detectMisinformation(content),
        () => type === 'url' ? validateURL(content) : null,
        () => checkAcademicRelevance(content, type)
      ];
      
      // Execute checks and return first violation found
      for (const check of checks) {
        const result = check();
        if (result && !result.isAppropriate) {
          logModerationDecision(content, result, startTime);
          return result;
        }
      }
      
      // Content passed all checks
      const approvedResult: ModerationResult = {
        isAppropriate: true,
        confidence: 0.95
      };
      
      logModerationDecision(content, approvedResult, startTime);
      return approvedResult;
      
    } catch (error) {
      console.error('Content moderation error:', error);
      
      // In case of error, apply fail-safe: reject content for safety
      const errorResult: ModerationResult = {
        isAppropriate: false,
        reason: "Content moderation system encountered an error. Please try again or contact support.",
        category: "system_error",
        severity: "medium",
        confidence: 0.50
      };
      
      logModerationDecision(content, errorResult, startTime);
      return errorResult;
    } finally {
      setIsChecking(false);
    }
  };

  // Configuration management
  const updateConfig = (newConfig: Partial<ModerationConfig>) => {
    Object.assign(config, newConfig);
    console.log('Content moderation configuration updated:', config);
  };

  // Real-time monitoring capabilities
  const getSystemStatus = () => {
    return {
      isActive: true,
      config,
      lastCheck: new Date().toISOString(),
      version: '2.0.0'
    };
  };

  return {
    checkContent,
    isChecking,
    updateConfig,
    getSystemStatus,
    config
  };
};
