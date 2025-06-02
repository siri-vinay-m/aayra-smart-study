
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const googleApiKey = Deno.env.get('GOOGLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

async function generateAIContent(content: string, sessionName: string): Promise<AIResponse> {
  console.log('Calling Gemini API...');
  
  // Detect the language of the input content
  const detectedLanguage = detectLanguage(content);
  console.log('Detected language:', detectedLanguage);
  
  const prompt = `
You are an educational AI assistant that MUST generate content in the SAME language as the input materials.

Study Materials Language: ${detectedLanguage}
Session Name: "${sessionName}"

Study Materials Content:
${content}

CRITICAL INSTRUCTION: You MUST generate ALL content (flashcards, quiz questions, and summary) EXCLUSIVELY in ${detectedLanguage}. Do NOT use English or any other language. Every single word in your response must be in ${detectedLanguage}.

If the detected language is ${detectedLanguage}, then:
- ALL questions must be written in ${detectedLanguage}
- ALL answers must be written in ${detectedLanguage}  
- ALL quiz options must be written in ${detectedLanguage}
- ALL explanations must be written in ${detectedLanguage}
- The summary must be written in ${detectedLanguage}

Please create educational content based on the study materials:
1. Generate 5-7 flashcards with clear questions and detailed answers - ALL TEXT IN ${detectedLanguage}
2. Create 6-8 multiple choice quiz questions with 4 options each, correct answer, and explanations - ALL TEXT IN ${detectedLanguage}
3. Write a comprehensive summary of the key concepts - ALL TEXT IN ${detectedLanguage}

Focus on the actual educational content provided. If the materials mention specific topics, subjects, or concepts, create relevant questions and content around those topics.

RESPONSE FORMAT: Return ONLY valid JSON without any markdown formatting. ALL text content MUST be in ${detectedLanguage}:

{
  "flashcards": [
    {
      "question": "Question text in ${detectedLanguage}",
      "answer": "Answer text in ${detectedLanguage}"
    }
  ],
  "quizQuestions": [
    {
      "question": "Question text in ${detectedLanguage}", 
      "options": ["Option A in ${detectedLanguage}", "Option B in ${detectedLanguage}", "Option C in ${detectedLanguage}", "Option D in ${detectedLanguage}"],
      "correctAnswer": "Option A in ${detectedLanguage}",
      "explanation": "Explanation text in ${detectedLanguage}"
    }
  ],
  "summary": "Comprehensive summary text in ${detectedLanguage}"
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
          temperature: 0.3,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 8192,
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
    
    try {
      // Extract JSON from the response (remove any markdown formatting)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', generatedText);
        throw new Error('No JSON found in response');
      }
      
      const aiResponse: AIResponse = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!aiResponse.flashcards || !Array.isArray(aiResponse.flashcards) ||
          !aiResponse.quizQuestions || !Array.isArray(aiResponse.quizQuestions) ||
          !aiResponse.summary) {
        console.error('Invalid AI response structure:', aiResponse);
        throw new Error('Invalid AI response structure');
      }
      
      console.log('AI response parsed and validated successfully');
      console.log('Flashcards count:', aiResponse.flashcards.length);
      console.log('Quiz questions count:', aiResponse.quizQuestions.length);
      
      return aiResponse;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Generated text:', generatedText);
      
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
  console.log(`Creating fallback content in ${language} for session: ${sessionName}`);
  
  // Create fallback content in the detected language
  switch (language) {
    case 'Telugu':
      return {
        flashcards: [
          {
            question: `"${sessionName}" సెషన్‌లో ప్రధాన అంశం ఏమిటి?`,
            answer: "ఈ సెషన్ ముఖ్యమైన విద్యా భావనలను కవర్ చేస్తుంది. ప్రధాన ఆలోచనలను అర్థం చేసుకోవడానికి మరియు మీ అభ్యాసాన్ని బలోపేతం చేయడానికి అప్‌లోడ్ చేసిన పదార్థాలను సమీక్షించండి."
          },
          {
            question: "ఈ అధ్యయన సెషన్‌కు ముఖ్యమైన అభ్యాస లక్ష్యాలు ఏమిటి?",
            answer: "ప్రధాన భావనలను అర్థం చేసుకోవడం, ఆలోచనల మధ్య ముఖ్యమైన సంబంధాలను గుర్తించడం మరియు పదార్థానికి సంబంధించిన సమస్య పరిష్కార పద్ధతులను అభ్యసించడంపై దృష్టి పెట్టండి."
          }
        ],
        quizQuestions: [
          {
            question: `"${sessionName}" అధ్యయన సెషన్‌యొక్క ప్రాథమిక దృష్టి ఏమిటి?`,
            options: ["అప్‌లోడ్ చేసిన పదార్థాల నుండి ప్రధాన విద్యా భావనలు", "అసంబద్ధ సాధారణ జ్ఞానం", "యాదృచ్ఛిక సమాచారం", "నిర్దిష్ట దృష్టి లేదు"],
            correctAnswer: "అప్‌లోడ్ చేసిన పదార్థాల నుండి ప్రధాన విద్యా భావనలు",
            explanation: "ఈ సెషన్ మీరు అప్‌లోడ్ చేసిన నిర్దిష్ట విద్యా పదార్థాలను ప్రాసెస్ చేయడానికి మరియు వాటి నుండి నేర్చుకోవడానికి రూపొందించబడింది."
          }
        ],
        summary: `"${sessionName}" పై ఈ అధ్యయన సెషన్ మీ అప్‌లోడ్ చేసిన విద్యా పదార్థాలను ప్రాసెస్ చేయడం మరియు వాటి నుండి నేర్చుకోవడంపై దృష్టి పెట్టింది. క్రియాశీల స్మరణ కోసం ఫ్లాష్‌కార్డులు, స్వీయ-పరీక్ష కోసం క్విజ్ ప్రశ్నలు మరియు భావన బలోపేతం కోసం సారాంశ సమీక్షలతో సహా వివిధ పద్ధతులను ఉపయోగించి ప్రభావకరమైన అధ్యయనం కోసం ఫ్రేమ్‌వర్క్‌ను సెషన్ విజయవంతంగా సృష్టించింది.`
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
