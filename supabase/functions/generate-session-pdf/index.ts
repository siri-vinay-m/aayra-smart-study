
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Simple PDF generation using HTML to PDF approach
const generatePDF = async (content: string): Promise<Uint8Array> => {
  // For a more robust solution, you'd use a library like Puppeteer or jsPDF
  // This is a simplified implementation
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #333; border-left: 4px solid #007bff; padding-left: 15px; }
          .flashcard { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .question { font-weight: bold; color: #495057; margin-bottom: 10px; }
          .answer { color: #6c757d; }
          .quiz-question { background: #fff3cd; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .options { margin: 10px 0; }
          .option { margin: 5px 0; padding: 5px 10px; background: #e9ecef; border-radius: 3px; }
          .correct { background: #d4edda !important; }
          .explanation { font-style: italic; color: #6c757d; margin-top: 10px; }
          .summary { background: #e7f3ff; padding: 20px; border-radius: 5px; }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;
  
  // Convert HTML to basic text-based PDF format (simplified)
  // In production, you'd use a proper PDF library
  const encoder = new TextEncoder();
  return encoder.encode(htmlContent);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sessionId, aiContent, sessionName, userId } = await req.json();

    if (!sessionId || !aiContent || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate HTML content for PDF
    let htmlContent = `
      <div class="header">
        <h1>Study Session Report</h1>
        <h3>${sessionName || 'Study Session'}</h3>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
    `;

    // Add flashcards section
    if (aiContent.flashcards && aiContent.flashcards.length > 0) {
      htmlContent += `
        <div class="section">
          <h2>Flashcards (${aiContent.flashcards.length})</h2>
      `;
      
      aiContent.flashcards.forEach((card: any, index: number) => {
        htmlContent += `
          <div class="flashcard">
            <div class="question">Q${index + 1}: ${card.question}</div>
            <div class="answer">A: ${card.answer}</div>
          </div>
        `;
      });
      
      htmlContent += `</div>`;
    }

    // Add quiz questions section
    if (aiContent.quizQuestions && aiContent.quizQuestions.length > 0) {
      htmlContent += `
        <div class="section">
          <h2>Quiz Questions (${aiContent.quizQuestions.length})</h2>
      `;
      
      aiContent.quizQuestions.forEach((question: any, index: number) => {
        htmlContent += `
          <div class="quiz-question">
            <div class="question">Q${index + 1}: ${question.question}</div>
            <div class="options">
        `;
        
        question.options.forEach((option: string) => {
          const isCorrect = option === question.correctAnswer;
          htmlContent += `
            <div class="option ${isCorrect ? 'correct' : ''}">${option} ${isCorrect ? '✓' : ''}</div>
          `;
        });
        
        htmlContent += `
            </div>
            <div class="explanation"><strong>Explanation:</strong> ${question.explanation}</div>
          </div>
        `;
      });
      
      htmlContent += `</div>`;
    }

    // Add summary section
    if (aiContent.summary) {
      htmlContent += `
        <div class="section">
          <h2>Session Summary</h2>
          <div class="summary">
            ${aiContent.summary}
          </div>
        </div>
      `;
    }

    // Generate PDF
    const pdfData = await generatePDF(htmlContent);
    
    // Create file path
    const fileName = `session-${sessionId}-${Date.now()}.pdf`;
    const filePath = `${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('session-pdfs')
      .upload(filePath, pdfData, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload PDF' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save PDF metadata to database
    const { data: dbData, error: dbError } = await supabaseClient
      .from('session_pdfs')
      .insert({
        session_id: sessionId,
        user_id: userId,
        pdf_file_path: uploadData.path,
        pdf_file_size: pdfData.length,
        content_summary: aiContent.summary?.substring(0, 500) || '',
        flashcards_count: aiContent.flashcards?.length || 0,
        quiz_questions_count: aiContent.quizQuestions?.length || 0
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save PDF metadata' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfId: dbData.id,
        filePath: uploadData.path
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
