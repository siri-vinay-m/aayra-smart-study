
/// <reference path="./deno.d.ts" />

// @deno-types="https://deno.land/x/xhr@0.1.0/mod.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @deno-types="https://deno.land/std@0.193.0/http/server.ts"
import { serve } from "https://deno.land/std@0.193.0/http/server.ts";

const googleApiKey = Deno.env.get('GOOGLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Output content moderation patterns
const OUTPUT_MODERATION_PATTERNS = {
  harmful_content: [
    // Hate speech and discrimination
    'hate', 'racist', 'sexist', 'homophobic', 'transphobic', 'xenophobic',
    'supremacist', 'nazi', 'fascist', 'terrorist', 'extremist',
    // Violence and threats
    'kill', 'murder', 'assault', 'attack', 'bomb', 'weapon', 'violence',
    'threat', 'harm', 'hurt', 'destroy', 'eliminate',
    // Sexual explicit content
    'sexual', 'porn', 'nude', 'explicit', 'erotic', 'intimate',
    // Self-harm and suicide
    'suicide', 'self-harm', 'cutting', 'overdose', 'hanging',
    // Illegal activities
    'drug', 'cocaine', 'heroin', 'marijuana', 'illegal', 'criminal',
    'fraud', 'scam', 'theft', 'robbery', 'hacking'
  ],
  bias_indicators: [
    // Gender bias
    'men are better', 'women are worse', 'girls can\'t', 'boys should',
    'feminine weakness', 'masculine superiority',
    // Racial bias
    'race is inferior', 'ethnicity determines', 'genetic superiority',
    'cultural inferiority', 'racial characteristics',
    // Age bias
    'too old to', 'too young to', 'generational weakness',
    // Religious bias
    'religion is evil', 'faith is stupid', 'believers are ignorant'
  ],
  misinformation_flags: [
    'proven fact that', 'scientists agree that', 'everyone knows',
    'obvious truth', 'undeniable evidence', 'conspiracy',
    'cover-up', 'hidden truth', 'they don\'t want you to know'
  ],
  non_academic: [
    'buy now', 'click here', 'subscribe', 'follow me',
    'like and share', 'promotional', 'advertisement',
    'personal opinion', 'my experience', 'i think', 'i believe'
  ]
}

// Content quality indicators for educational material
const ACADEMIC_QUALITY_INDICATORS = {
  positive: [
    'research shows', 'studies indicate', 'according to', 'evidence suggests',
    'peer-reviewed', 'published', 'methodology', 'analysis',
    'conclusion', 'hypothesis', 'theory', 'principle',
    'definition', 'concept', 'framework', 'model'
  ],
  structure_words: [
    'introduction', 'overview', 'summary', 'conclusion',
    'first', 'second', 'third', 'finally', 'therefore',
    'however', 'furthermore', 'moreover', 'additionally'
  ]
}

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing study materials request...');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    // Check if Google API key is available
    if (!googleApiKey) {
      console.error('Google API key not found');
      return new Response(
        JSON.stringify({ error: 'Google API key not configured. Please set the GOOGLE_API_KEY environment variable.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Google API key is available');

    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    
    const { materials, sessionName } = requestBody;

    if (!materials || !Array.isArray(materials)) {
      console.error('Invalid materials provided:', materials);
      return new Response(
        JSON.stringify({ error: 'Invalid materials provided. Expected an array.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (materials.length === 0) {
      console.error('No materials provided');
      return new Response(
        JSON.stringify({ error: 'No study materials provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each material and extract meaningful content
    const processedContent = await Promise.all(
      materials.map(async (material: StudyMaterial) => {
        console.log(`Processing material ${material.id} of type ${material.type}`);
        
        let content = '';
        switch (material.type) {
          case 'text':
            content = `Text Note: ${material.content}`;
            break;
          case 'file':
            content = `File Content (${material.filename || 'unknown'}): ${material.content}`;
            break;
          case 'url':
            try {
              const url = new URL(material.content);
              content = `Educational Resource from ${url.hostname}: ${material.content}. This appears to be an educational document or resource that should be used to generate relevant study materials.`;
            } catch {
              content = `Educational Resource: ${material.content}. This appears to be an educational document or resource.`;
            }
            break;
          case 'voice':
            content = `Voice Recording Content: ${material.content}. This is educational content from an audio recording.`;
            break;
          default:
            content = `Study Material: ${material.content}`;
        }
        return content;
      })
    );

    const combinedContent = processedContent.join('\n\n');

    console.log('Processing study materials for session:', sessionName);
    console.log('Combined content length:', combinedContent.length);
    console.log('Combined content preview:', combinedContent.substring(0, 500));

    // Generate AI content using Google Gemini
    const aiResponse = await generateAIContent(combinedContent, sessionName);
    console.log('AI response generated successfully');

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-study-materials function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'No additional details available'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Output content moderation function
function moderateAIOutput(content: string): { isAppropriate: boolean; reason?: string; filteredContent?: string } {
  const normalizedContent = content.toLowerCase();
  
  // Check for harmful content
  for (const pattern of OUTPUT_MODERATION_PATTERNS.harmful_content) {
    if (normalizedContent.includes(pattern.toLowerCase())) {
      return {
        isAppropriate: false,
        reason: `Generated content contains inappropriate material (${pattern}) and has been rejected for safety.`
      };
    }
  }
  
  // Check for bias indicators
  for (const pattern of OUTPUT_MODERATION_PATTERNS.bias_indicators) {
    if (normalizedContent.includes(pattern.toLowerCase())) {
      return {
        isAppropriate: false,
        reason: `Generated content contains biased language (${pattern}) and has been rejected to ensure inclusivity.`
      };
    }
  }
  
  // Check for misinformation flags
  for (const pattern of OUTPUT_MODERATION_PATTERNS.misinformation_flags) {
    if (normalizedContent.includes(pattern.toLowerCase())) {
      return {
        isAppropriate: false,
        reason: `Generated content contains potential misinformation indicators (${pattern}) and has been rejected.`
      };
    }
  }
  
  // Check for non-academic content
  for (const pattern of OUTPUT_MODERATION_PATTERNS.non_academic) {
    if (normalizedContent.includes(pattern.toLowerCase())) {
      return {
        isAppropriate: false,
        reason: `Generated content contains non-academic material (${pattern}) and has been rejected.`
      };
    }
  }
  
  // Content quality assessment
  const hasAcademicIndicators = ACADEMIC_QUALITY_INDICATORS.positive.some(indicator => 
    normalizedContent.includes(indicator.toLowerCase())
  );
  
  const hasStructure = ACADEMIC_QUALITY_INDICATORS.structure_words.some(word => 
    normalizedContent.includes(word.toLowerCase())
  );
  
  // If content is substantial but lacks academic quality, flag it
  if (content.length > 200 && !hasAcademicIndicators && !hasStructure) {
    return {
      isAppropriate: false,
      reason: "Generated content lacks academic structure and educational value."
    };
  }
  
  // Filter out any remaining problematic phrases while preserving educational content
  let filteredContent = content;
  
  // Remove any personal opinions or subjective statements that slipped through
  const subjectivePatterns = [
    /\b(in my opinion|i think|i believe|personally|i feel)\b/gi,
    /\b(obviously|clearly|everyone knows)\b/gi
  ];
  
  for (const pattern of subjectivePatterns) {
    filteredContent = filteredContent.replace(pattern, '');
  }
  
  // Clean up any double spaces or formatting issues
  filteredContent = filteredContent.replace(/\s+/g, ' ').trim();
  
  return {
    isAppropriate: true,
    filteredContent: filteredContent
  };
}

function detectLanguage(content: string): string {
  console.log('Detecting language for content:', content.substring(0, 200));
  
  // Simple language detection based on character patterns and common words
  const text = content.toLowerCase();
  
  // Telugu detection - check for Telugu Unicode range
  const teluguPattern = /[\u0c00-\u0c7f]/;
  if (teluguPattern.test(content)) {
    console.log('Telugu script detected');
    return 'Telugu';
  }
  
  // Hindi detection - check for Devanagari script
  const hindiPattern = /[\u0900-\u097f]/;
  if (hindiPattern.test(content)) {
    console.log('Hindi script detected');
    return 'Hindi';
  }
  
  // Tamil detection
  const tamilPattern = /[\u0b80-\u0bff]/;
  if (tamilPattern.test(content)) {
    console.log('Tamil script detected');
    return 'Tamil';
  }
  
  // Kannada detection
  const kannadaPattern = /[\u0c80-\u0cff]/;
  if (kannadaPattern.test(content)) {
    console.log('Kannada script detected');
    return 'Kannada';
  }
  
  // Malayalam detection
  const malayalamPattern = /[\u0d00-\u0d7f]/;
  if (malayalamPattern.test(content)) {
    console.log('Malayalam script detected');
    return 'Malayalam';
  }
  
  // Gujarati detection
  const gujaratiPattern = /[\u0a80-\u0aff]/;
  if (gujaratiPattern.test(content)) {
    console.log('Gujarati script detected');
    return 'Gujarati';
  }
  
  // Punjabi detection
  const punjabiPattern = /[\u0a00-\u0a7f]/;
  if (punjabiPattern.test(content)) {
    console.log('Punjabi script detected');
    return 'Punjabi';
  }
  
  // Bengali detection
  const bengaliPattern = /[\u0980-\u09ff]/;
  if (bengaliPattern.test(content)) {
    console.log('Bengali script detected');
    return 'Bengali';
  }
  
  // Marathi detection (uses Devanagari but can be distinguished by context)
  const marathiWords = ['आहे', 'आणि', 'तो', 'ती', 'ते', 'या', 'की', 'होते', 'करतो', 'करते'];
  if (marathiWords.some(word => text.includes(word))) {
    console.log('Marathi words detected');
    return 'Marathi';
  }
  
  // Spanish detection
  const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'una', 'las'];
  const spanishCount = spanishWords.filter(word => text.includes(' ' + word + ' ') || text.startsWith(word + ' ') || text.endsWith(' ' + word)).length;
  if (spanishCount >= 3) {
    console.log('Spanish words detected');
    return 'Spanish';
  }
  
  // French detection
  const frenchWords = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'grand', 'quand', 'même', 'lui', 'nous', 'sans', 'peut'];
  const frenchCount = frenchWords.filter(word => text.includes(' ' + word + ' ') || text.startsWith(word + ' ') || text.endsWith(' ' + word)).length;
  if (frenchCount >= 3) {
    console.log('French words detected');
    return 'French';
  }
  
  // German detection
  const germanWords = ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als', 'auch', 'es', 'an', 'werden', 'aus', 'er', 'hat', 'dass', 'sie', 'nach'];
  const germanCount = germanWords.filter(word => text.includes(' ' + word + ' ') || text.startsWith(word + ' ') || text.endsWith(' ' + word)).length;
  if (germanCount >= 3) {
    console.log('German words detected');
    return 'German';
  }
  
  // Portuguese detection
  const portugueseWords = ['de', 'a', 'o', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu'];
  const portugueseCount = portugueseWords.filter(word => text.includes(' ' + word + ' ') || text.startsWith(word + ' ') || text.endsWith(' ' + word)).length;
  if (portugueseCount >= 3) {
    console.log('Portuguese words detected');
    return 'Portuguese';
  }
  
  // Italian detection
  const italianWords = ['di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'e', 'che', 'non', 'è', 'si', 'sono', 'stato', 'questa', 'questo'];
  const italianCount = italianWords.filter(word => text.includes(' ' + word + ' ') || text.startsWith(word + ' ') || text.endsWith(' ' + word)).length;
  if (italianCount >= 3) {
    console.log('Italian words detected');
    return 'Italian';
  }
  
  // Default to English if no other language detected
  console.log('No specific language detected, defaulting to English');
  return 'English';
}

// Content preprocessing function to improve clarity and organization
function preprocessContent(content: string): string {
  console.log('Preprocessing content for better AI generation...');
  
  // Remove excessive whitespace and normalize line breaks
  let processedContent = content.replace(/\s+/g, ' ').trim();
  
  // Break down dense paragraphs (longer than 500 characters) into smaller segments
  const sentences = processedContent.split(/[.!?]+/);
  const organizedSentences: string[] = [];
  let currentParagraph = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (trimmedSentence.length === 0) continue;
    
    if (currentParagraph.length + trimmedSentence.length > 400) {
      if (currentParagraph) {
        organizedSentences.push(currentParagraph.trim() + '.');
      }
      currentParagraph = trimmedSentence;
    } else {
      currentParagraph += (currentParagraph ? '. ' : '') + trimmedSentence;
    }
  }
  
  if (currentParagraph) {
    organizedSentences.push(currentParagraph.trim() + '.');
  }
  
  // Join with double line breaks for better paragraph separation
  processedContent = organizedSentences.join('\n\n');
  
  // Identify and emphasize key concepts (terms in quotes, capitalized terms, numbered items)
  processedContent = processedContent.replace(/"([^"]+)"/g, '**KEY CONCEPT: $1**');
  processedContent = processedContent.replace(/\b([A-Z][A-Z\s]{2,})\b/g, '**IMPORTANT: $1**');
  processedContent = processedContent.replace(/(\d+\.)\s*([^\n]+)/g, '**$1** $2');
  
  // Add section markers for better organization
  const sections = processedContent.split('\n\n');
  if (sections.length > 3) {
    const organizedSections: string[] = [];
    for (let i = 0; i < sections.length; i++) {
      if (i % 3 === 0 && i > 0) {
        organizedSections.push(`\n--- SECTION ${Math.floor(i/3) + 1} ---\n`);
      }
      organizedSections.push(sections[i]);
    }
    processedContent = organizedSections.join('\n\n');
  }
  
  console.log('Content preprocessing completed. Original length:', content.length, 'Processed length:', processedContent.length);
  return processedContent;
}

async function generateAIContent(content: string, sessionName: string): Promise<AIResponse> {
  console.log('Calling Gemini API with enhanced content generation...');
  
  // Preprocess the content for better clarity and organization
  const preprocessedContent = preprocessContent(content);
  
  // Detect the language of the input content
  const detectedLanguage = detectLanguage(content);
  console.log('Detected language:', detectedLanguage);
  
  const prompt = `
IMPORTANT GUIDELINES:
- Generate only factual, educational content
- Avoid personal opinions, bias, or controversial statements
- Ensure content is appropriate for academic purposes
- Do not include harmful, discriminatory, or inappropriate material
- Focus on objective, evidence-based information

You are an educational AI assistant that MUST generate content in the SAME language as the input materials.

Study Materials Language: ${detectedLanguage}
Session Name: "${sessionName}"

STUDENT LEVEL: INTERMEDIATE
- Assume students have foundational knowledge in the subject
- Create content that builds upon basic concepts
- Include moderate complexity in explanations
- Use terminology appropriate for intermediate learners

PREPROCESSED Study Materials Content:
${preprocessedContent}

CRITICAL INSTRUCTION: You MUST generate ALL content (flashcards, quiz questions, and summary) EXCLUSIVELY in ${detectedLanguage}. Do NOT use English or any other language. Every single word in your response must be in ${detectedLanguage}.

CONTENT GENERATION REQUIREMENTS:

1. FLASHCARDS (Generate 6-8 flashcards):
   - Focus on key concepts highlighted in the preprocessed content
   - Questions should test understanding of important terms and concepts
   - Answers should be detailed and comprehensive (2-3 sentences minimum)
   - Include examples or applications where relevant

2. QUIZ QUESTIONS (Generate 8-10 questions, MEDIUM TO HARD difficulty):
   - CONCEPTUAL UNDERSTANDING (30%): Test theoretical knowledge and principles
   - APPLICATION-BASED (40%): Require students to apply concepts to new situations
   - HIGHER-ORDER THINKING (30%): Analysis, synthesis, evaluation questions
   - Each question must have exactly 4 options
   - Explanations should be detailed (3-4 sentences) explaining why the answer is correct
   - Avoid simple recall questions - focus on understanding and application

3. SUMMARY (Detailed and comprehensive):
   - Organize into 4-6 small, focused paragraphs
   - Each paragraph should cover a distinct aspect or concept
   - Include specific details, examples, and connections between concepts
   - Minimum 300 words total
   - Use clear topic sentences for each paragraph
   - Conclude with implications or applications

Focus on the emphasized concepts and key terms from the preprocessed content. Pay special attention to content marked with **KEY CONCEPT**, **IMPORTANT**, and section divisions.

RESPONSE FORMAT: Return ONLY valid JSON without any markdown formatting. ALL text content MUST be in ${detectedLanguage}:

{
  "flashcards": [
    {
      "question": "Detailed question text in ${detectedLanguage}",
      "answer": "Comprehensive answer with examples in ${detectedLanguage}"
    }
  ],
  "quizQuestions": [
    {
      "question": "Application or analysis question in ${detectedLanguage}", 
      "options": ["Option A in ${detectedLanguage}", "Option B in ${detectedLanguage}", "Option C in ${detectedLanguage}", "Option D in ${detectedLanguage}"],
      "correctAnswer": "Option A in ${detectedLanguage}",
      "explanation": "Detailed explanation (3-4 sentences) in ${detectedLanguage}"
    }
  ],
  "summary": "Comprehensive multi-paragraph summary (300+ words) organized in 4-6 focused paragraphs in ${detectedLanguage}"
}

REMEMBER: Every single word in your response must be in ${detectedLanguage}. Do not mix languages.
`;

  try {
    console.log('Making request to Gemini API with language-specific prompt...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.4,  // Slightly higher for more detailed and creative responses
          topK: 40,          // Increased for more diverse vocabulary
          topP: 0.9,         // Higher for better coherence in longer responses
          maxOutputTokens: 12288,  // Increased for comprehensive summaries and detailed explanations
        },
      }),
    });

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', response.status, errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('Gemini API response received successfully');

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid response structure from Gemini API:', data);
      throw new Error('Invalid response from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('Generated text received, length:', generatedText.length);
    console.log('Generated text preview:', generatedText.substring(0, 300));
    
    // Apply output moderation to the raw AI response
    const moderationResult = moderateAIOutput(generatedText);
    if (!moderationResult.isAppropriate) {
      console.error('AI output rejected by moderation:', moderationResult.reason);
      return createLanguageSpecificFallback(sessionName, detectedLanguage);
    }
    
    const moderatedText = moderationResult.filteredContent || generatedText;
    
    try {
      // Extract JSON from the response (remove any markdown formatting)
      const jsonMatch = moderatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', moderatedText);
        throw new Error('No JSON found in response');
      }
      
      const aiResponse: AIResponse = JSON.parse(jsonMatch[0]);
      
      // Apply moderation to each component of the parsed content
      const moderatedResponse: AIResponse = {
        flashcards: [] as Array<{ question: string; answer: string; }>,
        quizQuestions: [] as Array<{ question: string; options: string[]; correctAnswer: string; explanation: string; }>,
        summary: ''
      };
      
      // Moderate flashcards
      if (aiResponse.flashcards && Array.isArray(aiResponse.flashcards)) {
        for (const flashcard of aiResponse.flashcards) {
          const questionModeration = moderateAIOutput(flashcard.question || '');
          const answerModeration = moderateAIOutput(flashcard.answer || '');
          
          if (questionModeration.isAppropriate && answerModeration.isAppropriate) {
            moderatedResponse.flashcards.push({
              question: questionModeration.filteredContent || flashcard.question,
              answer: answerModeration.filteredContent || flashcard.answer
            });
          }
        }
      }
      
      // Moderate quiz questions
      if (aiResponse.quizQuestions && Array.isArray(aiResponse.quizQuestions)) {
        for (const quizItem of aiResponse.quizQuestions) {
          const questionModeration = moderateAIOutput(quizItem.question || '');
          const explanationModeration = moderateAIOutput(quizItem.explanation || '');
          
          if (questionModeration.isAppropriate && explanationModeration.isAppropriate) {
            const moderatedOptions: string[] = [];
            let allOptionsAppropriate = true;
            
            if (quizItem.options && Array.isArray(quizItem.options)) {
              for (const option of quizItem.options) {
                const optionModeration = moderateAIOutput(option || '');
                if (optionModeration.isAppropriate) {
                  moderatedOptions.push(optionModeration.filteredContent || option);
                } else {
                  allOptionsAppropriate = false;
                  break;
                }
              }
            }
            
            if (allOptionsAppropriate && moderatedOptions.length === 4) {
              const correctAnswerModeration = moderateAIOutput(quizItem.correctAnswer || '');
              if (correctAnswerModeration.isAppropriate) {
                moderatedResponse.quizQuestions.push({
                  question: questionModeration.filteredContent || quizItem.question,
                  options: moderatedOptions,
                  correctAnswer: correctAnswerModeration.filteredContent || quizItem.correctAnswer,
                  explanation: explanationModeration.filteredContent || quizItem.explanation
                });
              }
            }
          }
        }
      }
      
      // Moderate summary
      if (aiResponse.summary) {
        const summaryModeration = moderateAIOutput(aiResponse.summary);
        if (summaryModeration.isAppropriate) {
          moderatedResponse.summary = summaryModeration.filteredContent || aiResponse.summary;
        }
      }
      
      // Ensure we have minimum quality content after moderation
      const minFlashcards = 5;  // Minimum 5 flashcards (target 6-8)
      const minQuizQuestions = 6;  // Minimum 6 quiz questions (target 8-10)
      const minSummaryLength = 200;  // Minimum 200 words for comprehensive summary (target 300+)
      
      const summaryWordCount = moderatedResponse.summary ? moderatedResponse.summary.split(/\s+/).length : 0;
      
      if (moderatedResponse.flashcards.length < minFlashcards || 
          moderatedResponse.quizQuestions.length < minQuizQuestions || 
          !moderatedResponse.summary || 
          summaryWordCount < minSummaryLength) {
        console.warn(`Insufficient quality content after moderation. Got: ${moderatedResponse.flashcards.length} flashcards (need ${minFlashcards}), ${moderatedResponse.quizQuestions.length} quiz questions (need ${minQuizQuestions}), ${summaryWordCount} words in summary (need ${minSummaryLength})`);
        return createLanguageSpecificFallback(sessionName, detectedLanguage);
      }
      
      console.log('AI response parsed, moderated and validated successfully');
      console.log('Flashcards count:', moderatedResponse.flashcards.length);
      console.log('Quiz questions count:', moderatedResponse.quizQuestions.length);
      
      return moderatedResponse;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Generated text:', moderatedText);
      
      // Create language-specific fallback response
      return createLanguageSpecificFallback(sessionName, detectedLanguage);
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    // Return language-specific fallback instead of throwing error
    return createLanguageSpecificFallback(sessionName, detectedLanguage);
  }
}

function createLanguageSpecificFallback(sessionName: string, language: string): AIResponse {
  console.log(`Creating enhanced fallback content in ${language} for session: ${sessionName}`);
  
  // Create comprehensive fallback content in the detected language
  switch (language) {
    case 'Telugu':
      return {
        flashcards: [
          {
            question: `"${sessionName}" సెషన్‌లో ప్రధాన అంశం ఏమిటి?`,
            answer: "ఈ సెషన్ ముఖ్యమైన విద్యా భావనలను కవర్ చేస్తుంది. ప్రధాన ఆలోచనలను అర్థం చేసుకోవడానికి మరియు మీ అభ్యాసాన్ని బలోపేతం చేయడానికి అప్‌లోడ్ చేసిన పదార్థాలను సమీక్షించండి. ఈ భావనలను వాస్తవ జీవిత పరిస్థితులకు వర్తింపజేయడం మీ అర్థాన్ని మరింత లోతుగా చేస్తుంది."
          },
          {
            question: "ఈ అధ్యయన సెషన్‌కు ముఖ్యమైన అభ్యాస లక్ష్యాలు ఏమిటి?",
            answer: "ప్రధాన భావనలను అర్థం చేసుకోవడం, ఆలోచనల మధ్య ముఖ్యమైన సంబంధాలను గుర్తించడం మరియు పదార్థానికి సంబంధించిన సమస్య పరిష్కార పద్ధతులను అభ్యసించడంపై దృష్టి పెట్టండి. విమర్శనాత్మక ఆలోచన మరియు విశ్లేషణాత్మక నైపుణ్యాలను అభివృద్ధి చేయడం కూడా ముఖ్యం."
          },
          {
            question: "ఈ విషయంలో అంతర్గత అవగాహన ఎలా పెంచుకోవాలి?",
            answer: "క్రమబద్ధమైన అధ్యయనం, క్రియాశీల పాల్గొనడం మరియు నిరంతర అభ్యాసం ద్వారా అంతర్గత అవగాహనను పెంచుకోవచ్చు. వివిధ దృక్కోణాల నుండి సమస్యలను చూడడం మరియు ఇతరులతో చర్చించడం కూడా సహాయకరం."
          },
          {
            question: "ఈ అంశాలను ఆచరణలో ఎలా వర్తింపజేయాలి?",
            answer: "సిద్ధాంతిక జ్ఞానాన్ని ఆచరణాత్మక పరిస్థితులకు వర్తింపజేయడం ద్వారా నిజమైన అర్థం వస్తుంది. కేస్ స్టడీలు, ప్రాజెక్టులు మరియు వాస్తవ జీవిత ఉదాహరణలతో అభ్యసించడం అవసరం."
          },
          {
            question: "ఈ విషయంలో సాధారణ తప్పులు ఏమిటి?",
            answer: "ఉపరితల అధ్యయనం, భావనల మధ్య సంబంధాలను విస్మరించడం మరియు ఆచరణాత్మక అనువర్తనను నిర్లక్ష్యం చేయడం వంటివి సాధారణ తప్పులు. లోతైన అవగాహన కోసం సమయం కేటాయించడం ముఖ్యం."
          }
        ],
        quizQuestions: [
          {
            question: `"${sessionName}" అధ్యయన సెషన్‌యొక్క ప్రాథమిక దృష్టి ఏమిటి?`,
            options: ["అప్‌లోడ్ చేసిన పదార్థాల నుండి ప్రధాన విద్యా భావనలు", "అసంబద్ధ సాధారణ జ్ఞానం", "యాదృచ్ఛిక సమాచారం", "నిర్దిష్ట దృష్టి లేదు"],
            correctAnswer: "అప్‌లోడ్ చేసిన పదార్థాల నుండి ప్రధాన విద్యా భావనలు",
            explanation: "ఈ సెషన్ మీరు అప్‌లోడ్ చేసిన నిర్దిష్ట విద్యా పదార్థాలను ప్రాసెస్ చేయడానికి మరియు వాటి నుండి నేర్చుకోవడానికి రూపొందించబడింది. ఇది వ్యక్తిగతీకరించిన అభ్యాస అనుభవాన్ని అందిస్తుంది మరియు మీ నిర్దిష్ట అవసరాలకు అనుగుణంగా ఉంటుంది."
          },
          {
            question: "ప్రభావకరమైన అధ్యయనానికి ఏ వ్యూహం అత్యంత ముఖ్యమైనది?",
            options: ["క్రియాశీల పాల్గొనడం మరియు విమర్శనాత్మక ఆలోచన", "నిష్క్రియ పఠనం మాత్రమే", "కేవలం గుర్తుంచుకోవడం", "వేగంగా చదవడం"],
            correctAnswer: "క్రియాశీల పాల్గొనడం మరియు విమర్శనాత్మక ఆలోచన",
            explanation: "క్రియాశీల అభ్యాసం మరియు విమర్శనాత్మక ఆలోచన లోతైన అవగాహనకు దారితీస్తాయి. ఇవి కేవలం సమాచారాన్ని గుర్తుంచుకోవడం కంటే భావనలను అర్థం చేసుకోవడంలో సహాయపడతాయి."
          },
          {
            question: "అధ్యయన పదార్థాలను ఎలా విశ్లేషించాలి?",
            options: ["ముఖ్య భావనలను గుర్తించి వాటి మధ్య సంబంధాలను అర్థం చేసుకోవాలి", "ప్రతి వాక్యాన్ని గుర్తుంచుకోవాలి", "వేగంగా చదివేయాలి", "కేవలం ముఖ్యమైన పాయింట్లను హైలైట్ చేయాలి"],
            correctAnswer: "ముఖ్య భావనలను గుర్తించి వాటి మధ్య సంబంధాలను అర్థం చేసుకోవాలి",
            explanation: "విజయవంతమైన అధ్యయనం కోసం ముఖ్య భావనలను గుర్తించడం మరియు వాటి మధ్య సంబంధాలను అర్థం చేసుకోవడం అవసరం. ఇది సమగ్ర అవగాహనకు దారితీస్తుంది మరియు జ్ఞానాన్ని వర్తింపజేయడంలో సహాయపడుతుంది."
          },
          {
            question: "అభ్యాస ప్రక్రియలో స్వీయ-మూల్యాంకనం ఎందుకు ముఖ్యమైనది?",
            options: ["అవగాహన స్థాయిని తనిఖీ చేయడానికి మరియు మెరుగుదల అవసరాలను గుర్తించడానికి", "కేవలం గ్రేడ్‌ల కోసం", "సమయం వృధా చేయడానికి", "ఇతరులతో పోల్చుకోవడానికి"],
            correctAnswer: "అవగాహన స్థాయిని తనిఖీ చేయడానికి మరియు మెరుగుదల అవసరాలను గుర్తించడానికి",
            explanation: "స్వీయ-మూల్యాంకనం మీ అవగాహన స్థాయిని అంచనా వేయడంలో మరియు ఏ ప్రాంతాలలో మరింత దృష్టి అవసరమో గుర్తించడంలో సహాయపడుతుంది. ఇది అభ్యాస వ్యూహాలను మెరుగుపరచడానికి మరియు లక్ష్యాలను సాధించడానికి అవసరం."
          },
          {
            question: "జ్ఞానాన్ని దీర్ఘకాలికంగా నిలుపుకోవడానికి ఉత్తమ పద్ధతి ఏది?",
            options: ["క్రమం తప్పకుండా సమీక్షించడం మరియు వివిధ సందర్భాలలో వర్తింపజేయడం", "ఒకసారి చదివేయడం", "పరీక్షకు ముందు మాత్రమే చదవడం", "కేవలం నోట్స్ తీసుకోవడం"],
            correctAnswer: "క్రమం తప్పకుండా సమీక్షించడం మరియు వివిధ సందర్భాలలో వర్తింపజేయడం",
            explanation: "దీర్ఘకాలిక జ్ఞాపకశక్తి కోసం క్రమం తప్పకుండా సమీక్షించడం మరియు వివిధ సందర్భాలలో జ్ఞానాన్ని వర్తింపజేయడం అవసరం. ఇది న్యూరల్ కనెక్షన్లను బలపరుస్తుంది మరియు అవగాహనను లోతుగా చేస్తుంది."
          },
          {
            question: "సమూహ అధ్యయనం యొక్క ప్రధాన ప్రయోజనం ఏమిటి?",
            options: ["వివిధ దృక్కోణాలను పంచుకోవడం మరియు సహకార అభ్యాసం", "సమయం ఆదా చేయడం", "పోటీ పడటం", "బాధ్యతను తప్పించడం"],
            correctAnswer: "వివిధ దృక్కోణాలను పంచుకోవడం మరియు సహకార అభ్యాసం",
            explanation: "సమూహ అధ్యయనం వివిధ దృక్కోణాలను పంచుకోవడానికి, ఒకరినొకరు బోధించుకోవడానికి మరియు సహకార అభ్యాస వాతావరణాన్ని సృష్టించడానికి అవకాశం కల్పిస్తుంది. ఇది అవగాహనను మెరుగుపరుస్తుంది మరియు సామాజిక అభ్యాస నైపుణ్యాలను అభివృద్ధి చేస్తుంది."
          }
        ],
        summary: `"${sessionName}" పై ఈ అధ్యయన సెషన్ మీ అప్‌లోడ్ చేసిన విద్యా పదార్థాలను ప్రాసెస్ చేయడం మరియు వాటి నుండి నేర్చుకోవడంపై దృష్టి పెట్టింది. ఈ సెషన్ ప్రభావకరమైన అధ్యయన వ్యూహాలను అభివృద్ధి చేయడానికి రూపొందించబడింది.\n\nప్రధాన అభ్యాస లక్ష్యాలు ముఖ్య భావనలను అర్థం చేసుకోవడం, వాటి మధ్య సంబంధాలను గుర్తించడం మరియు ఆచరణాత్మక అనువర్తనలను అభ్యసించడంపై దృష్టి పెట్టాయి. విమర్శనాత్మక ఆలోచన మరియు విశ్లేషణాత్మక నైపుణ్యాలను అభివృద్ధి చేయడం కూడా ముఖ్యమైన అంశంగా నొక్కిచెప్పబడింది.\n\nఅధ్యయన పద్ధతుల్లో క్రియాశీల పాల్గొనడం, క్రమం తప్పకుండా సమీక్షించడం మరియు స్వీయ-మూల్యాంకనం వంటివి ఉన్నాయి. ఈ వ్యూహాలు లోతైన అవగాహనకు దారితీస్తాయి మరియు దీర్ఘకాలిక జ్ఞాపకశక్తిని మెరుగుపరుస్తాయి.\n\nసమూహ అధ్యయనం మరియు సహకార అభ్యాసం వంటి సామాజిక అభ్యాస పద్ధతులు కూడా ప్రోత్సాహించబడ్డాయి. ఇవి వివిధ దృక్కోణాలను పంచుకోవడానికి మరియు ఒకరినొకరు బోధించుకోవడానికి అవకాశం కల్పిస్తాయి.\n\nచివరగా, ఈ సెషన్ జ్ఞానాన్ని వాస్తవ జీవిత పరిస్థితులకు వర్తింపజేయడం యొక్క ప్రాముఖ్యతను నొక్కిచెప్పింది. ఇది విద్యార్థులకు సిద్ధాంతిక జ్ఞానాన్ని ఆచరణాత్మక నైపుణ్యాలుగా మార్చడంలో సహాయపడుతుంది మరియు వారి మొత్తం అభ్యాస అనుభవాన్ని మెరుగుపరుస్తుంది.`
      };
    
    case 'Hindi':
      return {
        flashcards: [
          {
            question: `"${sessionName}" सत्र में मुख्य विषय क्या था?`,
            answer: "इस सत्र में महत्वपूर्ण शैक्षणिक अवधारणाओं को कवर किया गया। मुख्य विचारों को समझने और अपने सीखने को मजबूत बनाने के लिए अपलोड की गई सामग्री की समीक्षा करें।"
          },
          {
            question: "इस अध्ययन सत्र के मुख्य सीखने के उद्देश्य क्या हैं?",
            answer: "मुख्य अवधारणाओं को समझने, विचारों के बीच महत्वपूर्ण संबंधों की पहचान करने और सामग्री से संबंधित समस्या-समाधान तकनीकों का अभ्यास करने पर ध्यान दें।"
          }
        ],
        quizQuestions: [
          {
            question: `"${sessionName}" अध्ययन सत्र का प्राथमिक फोकस क्या था?`,
            options: ["अपलोड की गई सामग्री से मुख्य शैक्षणिक अवधारणाएं", "असंबंधित सामान्य ज्ञान", "यादृच्छिक जानकारी", "कोई विशिष्ट फोकस नहीं"],
            correctAnswer: "अपलोड की गई सामग्री से मुख्य शैक्षणिक अवधारणाएं",
            explanation: "यह सत्र आपके द्वारा अपलोड की गई विशिष्ट शैक्षणिक सामग्री को प्रोसेस करने और उससे सीखने के लिए डिज़ाइन किया गया था।"
          }
        ],
        summary: `"${sessionName}" पर यह अध्ययन सत्र आपकी अपलोड की गई शैक्षणिक सामग्री को प्रोसेस करने और उससे सीखने पर केंद्रित था। सत्र ने सक्रिय याद के लिए फ्लैशकार्ड, स्व-परीक्षण के लिए क्विज़ प्रश्न, और अवधारणा सुदृढ़ीकरण के लिए सारांश समीक्षा सहित विभिन्न तकनीकों का उपयोग करके प्रभावी अध्ययन के लिए एक ढांचा सफलतापूर्वक बनाया।`
      };
    
    default: // English fallback
      return {
        flashcards: [
          {
            question: `What was the main topic covered in the "${sessionName}" session?`,
            answer: "This session covered important educational concepts. Review the uploaded materials to understand the main ideas and practice applying them to reinforce your learning."
          },
          {
            question: "What are the key learning objectives for this study session?",
            answer: "Focus on understanding the core concepts, identifying important relationships between ideas, and practicing problem-solving techniques related to the material."
          }
        ],
        quizQuestions: [
          {
            question: `What was the primary focus of the "${sessionName}" study session?`,
            options: ["Core educational concepts from uploaded materials", "Unrelated general knowledge", "Random information", "No specific focus"],
            correctAnswer: "Core educational concepts from uploaded materials",
            explanation: "This session was designed to process and learn from the specific educational materials you uploaded, creating targeted study content."
          }
        ],
        summary: `This study session on "${sessionName}" focused on processing and learning from your uploaded educational materials. The session successfully created a framework for effective studying using various techniques including flashcards for active recall, quiz questions for self-testing, and summary reviews for concept reinforcement.`
      };
  }
}
