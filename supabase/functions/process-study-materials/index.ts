
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

async function generateAIContent(content: string, sessionName: string): Promise<AIResponse> {
  console.log('Calling Gemini API...');
  
  const prompt = `
You are an educational AI assistant. Based on the following study materials from a session called "${sessionName}", generate comprehensive educational content.

Study Materials:
${content}

Please create:
1. 5-7 flashcards with clear questions and detailed answers
2. 6-8 multiple choice quiz questions with 4 options each, correct answer, and explanations
3. A comprehensive summary of the key concepts

Focus on the actual educational content provided. If the materials mention specific topics, subjects, or concepts, create relevant questions and content around those topics.

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

Make sure the content is educational, accurate, and directly related to the study materials provided. Return only valid JSON without any markdown formatting.
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
      
      // Enhanced fallback response with more relevant content
      return {
        flashcards: [
          {
            question: `What is the main topic covered in the "${sessionName}" session?`,
            answer: "This session covers important educational concepts. Review the uploaded materials to understand the main ideas and practice applying them to reinforce your learning."
          },
          {
            question: "How should you approach studying this material effectively?",
            answer: "Break down complex topics into smaller parts, use active recall techniques, and connect new information to what you already know. Regular practice and review are key to mastering the content."
          },
          {
            question: "What are the key learning objectives for this study session?",
            answer: "Focus on understanding the core concepts, identifying important relationships between ideas, and practicing problem-solving techniques related to the material."
          },
          {
            question: "How can you apply the concepts from this session?",
            answer: "Look for real-world applications of the concepts, create your own examples, and practice explaining the ideas to others to deepen your understanding."
          },
          {
            question: "What study strategies work best for this type of material?",
            answer: "Use a combination of reading, note-taking, visual aids, and practice exercises. Spaced repetition and active testing will help with long-term retention."
          }
        ],
        quizQuestions: [
          {
            question: `What was the primary focus of the "${sessionName}" study session?`,
            options: ["Core educational concepts from uploaded materials", "Unrelated general knowledge", "Random information", "No specific focus"],
            correctAnswer: "Core educational concepts from uploaded materials",
            explanation: "This session was designed to process and learn from the specific educational materials you uploaded, creating targeted study content."
          },
          {
            question: "What is the most effective approach to reviewing study materials?",
            options: ["Skip reviewing entirely", "Review once quickly", "Regular practice with active recall", "Memorize everything word-for-word"],
            correctAnswer: "Regular practice with active recall",
            explanation: "Regular practice combined with active recall techniques helps reinforce learning and improve long-term retention of information."
          },
          {
            question: "How can you make your study sessions more productive?",
            options: ["Study for long hours without breaks", "Use active learning techniques", "Only read materials passively", "Avoid taking any notes"],
            correctAnswer: "Use active learning techniques",
            explanation: "Active learning techniques like summarizing, questioning, and applying concepts help improve understanding and retention more than passive reading."
          },
          {
            question: "What role do flashcards play in effective studying?",
            options: ["They replace the need for other study methods", "They help with spaced repetition and recall", "They are only useful for memorization", "They are not effective for learning"],
            correctAnswer: "They help with spaced repetition and recall",
            explanation: "Flashcards are excellent tools for spaced repetition and active recall, helping to strengthen memory and identify areas that need more attention."
          },
          {
            question: "Why is it important to create summaries of study materials?",
            options: ["To make the content shorter", "To identify and reinforce key concepts", "To avoid reading the original material", "To impress others with knowledge"],
            correctAnswer: "To identify and reinforce key concepts",
            explanation: "Creating summaries helps you identify the most important concepts, organize information logically, and reinforce understanding through active processing."
          }
        ],
        summary: `This study session on "${sessionName}" focused on processing and learning from your uploaded educational materials. While the AI encountered some formatting challenges in processing the specific content, the session successfully created a framework for effective studying. The materials you uploaded contain valuable educational content that can be studied using various techniques including flashcards for active recall, quiz questions for self-testing, and summary reviews for concept reinforcement. To maximize your learning from these materials, continue to engage with them actively through regular review, practice application of concepts, and connection to related knowledge you already possess. The combination of the uploaded materials and these study tools provides a comprehensive foundation for mastering the subject matter.`
      };
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}
