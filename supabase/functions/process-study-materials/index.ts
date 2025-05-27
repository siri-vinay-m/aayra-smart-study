
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
    const { materials, sessionName } = await req.json();

    if (!materials || !Array.isArray(materials)) {
      return new Response(
        JSON.stringify({ error: 'Invalid materials provided' }),
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
          content = `File (${material.filename}): ${material.content}`;
          break;
        case 'url':
          content = `URL Reference: ${material.content}`;
          break;
        case 'voice':
          content = `Voice Recording: ${material.content}`;
          break;
      }
      return content;
    }).join('\n\n');

    console.log('Processing study materials for session:', sessionName);
    console.log('Combined content length:', combinedContent.length);

    // Generate AI content using Google Gemini
    const aiResponse = await generateAIContent(combinedContent, sessionName);

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-study-materials function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateAIContent(content: string, sessionName: string): Promise<AIResponse> {
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

Make sure the content is educational, accurate, and directly related to the study materials provided.
`;

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
    console.error('Gemini API error:', errorData);
    throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  console.log('Gemini API response:', data);

  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response from Gemini API');
  }

  const generatedText = data.candidates[0].content.parts[0].text;
  
  try {
    // Extract JSON from the response (remove any markdown formatting)
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const aiResponse: AIResponse = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (!aiResponse.flashcards || !aiResponse.quizQuestions || !aiResponse.summary) {
      throw new Error('Invalid AI response structure');
    }
    
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
        }
      ],
      quizQuestions: [
        {
          question: "What was covered in this study session?",
          options: ["The main concepts", "Unrelated topics", "Nothing specific", "Random information"],
          correctAnswer: "The main concepts",
          explanation: "This session focused on the main concepts from the study materials."
        }
      ],
      summary: "This study session covered important concepts. The AI was unable to parse the specific content, but the materials have been processed for review."
    };
  }
}
