
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
    
    // Check if Google API key is available
    if (!googleApiKey) {
      console.error('Google API key not found');
      return new Response(
        JSON.stringify({ error: 'Google API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody = await req.json();
    console.log('Request body received:', requestBody);
    
    const { materials, sessionName } = requestBody;

    if (!materials || !Array.isArray(materials)) {
      console.error('Invalid materials provided:', materials);
      return new Response(
        JSON.stringify({ error: 'Invalid materials provided' }),
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

    // Combine all study materials into a single text
    const combinedContent = materials.map((material: StudyMaterial) => {
      let content = '';
      switch (material.type) {
        case 'text':
          content = `Text Note: ${material.content}`;
          break;
        case 'file':
          content = `File (${material.filename || 'unknown'}): ${material.content}`;
          break;
        case 'url':
          content = `URL Reference: ${material.content}`;
          break;
        case 'voice':
          content = `Voice Recording: ${material.content}`;
          break;
        default:
          content = `Content: ${material.content}`;
      }
      return content;
    }).join('\n\n');

    console.log('Processing study materials for session:', sessionName);
    console.log('Combined content length:', combinedContent.length);

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
      JSON.stringify({ error: errorMessage }),
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

Make sure the content is educational, accurate, and directly related to the study materials provided. Return only valid JSON.
`;

  try {
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
      return aiResponse;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Generated text:', generatedText);
      
      // Fallback response if parsing fails
      return {
        flashcards: [
          {
            question: "What was the main topic of this study session?",
            answer: "Based on the materials provided, this session covered key concepts that were studied."
          },
          {
            question: "What are the important points to remember?",
            answer: "Review the key concepts and practice applying them in different contexts."
          }
        ],
        quizQuestions: [
          {
            question: "What was covered in this study session?",
            options: ["The main concepts", "Unrelated topics", "Nothing specific", "Random information"],
            correctAnswer: "The main concepts",
            explanation: "This session focused on the main concepts from the study materials."
          },
          {
            question: "How should you approach reviewing this material?",
            options: ["Skip reviewing", "Review once quickly", "Practice regularly", "Memorize everything"],
            correctAnswer: "Practice regularly",
            explanation: "Regular practice helps reinforce learning and improve retention."
          }
        ],
        summary: "This study session covered important concepts. The AI processed the materials but encountered some formatting issues. Please review the flashcards and quiz questions for the key points covered."
      };
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}
