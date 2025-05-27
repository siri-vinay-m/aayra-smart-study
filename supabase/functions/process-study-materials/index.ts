
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
            // For file materials, we expect the content to be a description or text extract
            content = `File (${material.filename || 'unknown'}): This is a study material file. Since file content extraction is not yet implemented, please generate educational content based on the filename and context.`;
            break;
          case 'url':
            // For URL materials, extract domain and provide context
            try {
              const url = new URL(material.content);
              content = `URL Reference: ${material.content} (Domain: ${url.hostname}). This is an educational resource link. Please generate relevant study content.`;
            } catch {
              content = `URL Reference: ${material.content}. This is an educational resource link.`;
            }
            break;
          case 'voice':
            content = `Voice Recording: This is a voice recording transcription. Please generate educational content based on this audio material.`;
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
    console.log('Combined content preview:', combinedContent.substring(0, 300));

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

async function generateAIContent(content: string, sessionName: string): Promise<AIResponse> {
  console.log('Calling Gemini API...');
  
  const prompt = `
You are an educational AI assistant. Based on the following study materials from a session called "${sessionName}", generate:

1. 5-7 flashcards with questions and answers
2. 6-8 multiple choice quiz questions with 4 options each, correct answer, and explanations
3. A comprehensive summary of the key concepts

Study Materials:
${content}

Please respond in the following JSON format:
{
  "flashcards": [
    {
      "question": "Question text",
      "answer": "Answer text"
    }
  ],
  "quizQuestions": [
    {
      "question": "Question text", 
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Explanation text"
    }
  ],
  "summary": "Comprehensive summary text"
}

Make sure the content is educational, accurate, and directly related to the study materials provided. If the materials are limited or unclear, create general educational content that would be helpful for studying. Return only valid JSON.
`;

  try {
    console.log('Making request to Gemini API...');
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
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
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
    console.log('Gemini API response received');

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid response structure from Gemini API:', data);
      throw new Error('Invalid response from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('Generated text received, length:', generatedText.length);
    console.log('Generated text preview:', generatedText.substring(0, 200));
    
    try {
      // Extract JSON from the response (remove any markdown formatting)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', generatedText);
        throw new Error('No JSON found in response');
      }
      
      const aiResponse: AIResponse = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!aiResponse.flashcards || !aiResponse.quizQuestions || !aiResponse.summary) {
        console.error('Invalid AI response structure:', aiResponse);
        throw new Error('Invalid AI response structure');
      }
      
      console.log('AI response parsed successfully');
      console.log('Flashcards count:', aiResponse.flashcards.length);
      console.log('Quiz questions count:', aiResponse.quizQuestions.length);
      
      return aiResponse;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Generated text:', generatedText);
      
      // Enhanced fallback response
      return {
        flashcards: [
          {
            question: `What is the main topic covered in the "${sessionName}" session?`,
            answer: "This session covers key educational concepts. Review the materials to understand the main ideas and practice applying them."
          },
          {
            question: "What are the important points to remember from this study session?",
            answer: "Focus on understanding the core concepts, practice problem-solving techniques, and review regularly to reinforce learning."
          },
          {
            question: "How should you approach studying this material?",
            answer: "Break down complex topics into smaller parts, use active recall techniques, and connect new information to what you already know."
          }
        ],
        quizQuestions: [
          {
            question: `What was the focus of the "${sessionName}" study session?`,
            options: ["Core educational concepts", "Unrelated topics", "Random information", "No specific focus"],
            correctAnswer: "Core educational concepts",
            explanation: "This session was designed to cover important educational concepts relevant to your studies."
          },
          {
            question: "What is the best approach to reviewing study materials?",
            options: ["Skip reviewing", "Review once quickly", "Regular practice and review", "Memorize everything"],
            correctAnswer: "Regular practice and review",
            explanation: "Regular practice and review helps reinforce learning and improve long-term retention of information."
          },
          {
            question: "How can you make your study sessions more effective?",
            options: ["Study for long hours without breaks", "Use active learning techniques", "Only read materials passively", "Avoid taking notes"],
            correctAnswer: "Use active learning techniques",
            explanation: "Active learning techniques like summarizing, questioning, and applying concepts help improve understanding and retention."
          }
        ],
        summary: `This study session on "${sessionName}" covered important educational concepts. While the AI processing encountered some formatting issues, the key focus was on providing you with study materials and learning opportunities. The session included various types of content to help reinforce your understanding. Continue to review the materials regularly and practice applying the concepts to improve your learning outcomes.`
      };
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}
