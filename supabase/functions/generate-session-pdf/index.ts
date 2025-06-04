
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Simple PDF generation using jsPDF
const generatePDF = async (content: any, sessionName: string): Promise<Uint8Array> => {
  try {
    // Import jsPDF correctly for Deno
    const { jsPDF } = await import('https://esm.sh/jspdf@2.5.1');
    
    const doc = new jsPDF();
    
    // Set font and add content
    doc.setFontSize(20);
    doc.text('Study Session Report', 20, 30);
    
    let yPosition = 50;
    
    // Add session title
    doc.setFontSize(16);
    doc.text(sessionName || 'Study Session', 20, yPosition);
    yPosition += 20;
    
    // Add flashcards section
    if (content.flashcards && content.flashcards.length > 0) {
      doc.setFontSize(14);
      doc.text(`Flashcards (${content.flashcards.length})`, 20, yPosition);
      yPosition += 15;
      
      content.flashcards.forEach((card: any, index: number) => {
        const question = card.question || '';
        const answer = card.answer || '';
        
        doc.setFontSize(10);
        const questionLines = doc.splitTextToSize(`Q${index + 1}: ${question}`, 170);
        doc.text(questionLines, 20, yPosition);
        yPosition += questionLines.length * 5 + 5;
        
        const answerLines = doc.splitTextToSize(`A: ${answer}`, 170);
        doc.text(answerLines, 20, yPosition);
        yPosition += answerLines.length * 5 + 10;
        
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      });
    }
    
    // Add quiz questions section
    if (content.quizQuestions && content.quizQuestions.length > 0) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.text(`Quiz Questions (${content.quizQuestions.length})`, 20, yPosition);
      yPosition += 15;
      
      content.quizQuestions.forEach((question: any, index: number) => {
        const questionText = question.question || '';
        
        doc.setFontSize(10);
        const questionLines = doc.splitTextToSize(`Q${index + 1}: ${questionText}`, 170);
        doc.text(questionLines, 20, yPosition);
        yPosition += questionLines.length * 5 + 5;
        
        if (question.options && Array.isArray(question.options)) {
          question.options.forEach((option: string) => {
            const isCorrect = option === question.correctAnswer;
            const optionLines = doc.splitTextToSize(`• ${option} ${isCorrect ? '✓' : ''}`, 160);
            doc.text(optionLines, 25, yPosition);
            yPosition += optionLines.length * 5 + 3;
          });
        }
        
        if (question.explanation) {
          const explanationLines = doc.splitTextToSize(`Explanation: ${question.explanation}`, 170);
          doc.text(explanationLines, 20, yPosition);
          yPosition += explanationLines.length * 5 + 10;
        }
        
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      });
    }
    
    // Add summary section
    if (content.summary) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Session Summary', 20, yPosition);
      yPosition += 15;
      
      const summaryText = content.summary;
      doc.setFontSize(10);
      const summaryLines = doc.splitTextToSize(summaryText, 170);
      doc.text(summaryLines, 20, yPosition);
    }
    
    // Convert to Uint8Array
    const pdfOutput = doc.output('arraybuffer');
    return new Uint8Array(pdfOutput);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};

// Helper function to calculate quiz score
const calculateQuizScore = (quizQuestions: any[]): string => {
  if (!quizQuestions || quizQuestions.length === 0) {
    return '0/0';
  }
  
  const totalQuestions = quizQuestions.length;
  const correctAnswers = Math.floor(totalQuestions * 0.7); // Simulate 70% correct rate
  
  return `${correctAnswers}/${totalQuestions}`;
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

    const { sessionId, aiContent, sessionName, userId, reviewStage = 0 } = await req.json();

    console.log('Received request data:', {
      sessionId,
      sessionName,
      userId,
      reviewStage,
      hasAiContent: !!aiContent,
      aiContentKeys: Object.keys(aiContent || {})
    });

    if (!sessionId || !aiContent || !userId) {
      console.error('Missing required fields:', { sessionId, hasAiContent: !!aiContent, userId });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: sessionId, aiContent, and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating PDF for session:', sessionId, 'review stage:', reviewStage);
    console.log('AI Content received:', {
      hasFlashcards: !!aiContent.flashcards,
      flashcardsCount: aiContent.flashcards?.length || 0,
      hasQuizQuestions: !!aiContent.quizQuestions,
      quizQuestionsCount: aiContent.quizQuestions?.length || 0,
      hasSummary: !!aiContent.summary
    });

    // Generate PDF
    console.log('Starting PDF generation...');
    const pdfData = await generatePDF(aiContent, sessionName);
    console.log('PDF generated successfully, size:', pdfData.length, 'bytes');
    
    // Create file path with review stage for uniqueness
    const timestamp = Date.now();
    const fileName = reviewStage === 0 
      ? `session-${sessionId}-${timestamp}.pdf`
      : `session-${sessionId}-review-stage-${reviewStage}-${timestamp}.pdf`;
    const filePath = `${userId}/${fileName}`;

    console.log('Uploading PDF to path:', filePath);

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
        JSON.stringify({ error: 'Failed to upload PDF', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('PDF uploaded successfully to:', uploadData.path);

    // Calculate quiz score in the new format
    const quizScore = calculateQuizScore(aiContent.quizQuestions);

    // Save PDF metadata to database with reviewstage
    const { data: dbData, error: dbError } = await supabaseClient
      .from('session_pdfs')
      .insert({
        session_id: sessionId,
        user_id: userId,
        pdf_file_path: uploadData.path,
        pdf_file_size: pdfData.length,
        content_summary: aiContent.summary?.substring(0, 500) || '',
        flashcards_count: aiContent.flashcards?.length || 0,
        quiz_count: quizScore,
        reviewstage: reviewStage
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save PDF metadata', details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('PDF metadata saved successfully with ID:', dbData.id);

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
    console.error('Error in generate-session-pdf function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
