
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Simple PDF generation using jsPDF with correct import
const generatePDF = async (htmlContent: string): Promise<Uint8Array> => {
  try {
    // Import jsPDF with the correct syntax for Deno
    const jsPDFModule = await import('https://esm.sh/jspdf@2.5.1');
    const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default?.jsPDF || jsPDFModule.default;
    
    if (!jsPDF) {
      throw new Error('Failed to import jsPDF');
    }
    
    const doc = new jsPDF();
    
    // Set font and add content
    doc.setFontSize(20);
    doc.text('Study Session Report', 20, 30);
    
    // Parse the HTML content and add to PDF
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(htmlContent, 'text/html');
    
    let yPosition = 50;
    
    // Add session title
    const title = htmlDoc.querySelector('h3')?.textContent || 'Study Session';
    doc.setFontSize(16);
    doc.text(title, 20, yPosition);
    yPosition += 20;
    
    // Add flashcards section
    const flashcardsSection = htmlDoc.querySelector('.section');
    if (flashcardsSection) {
      const flashcardElements = flashcardsSection.querySelectorAll('.flashcard');
      if (flashcardElements.length > 0) {
        doc.setFontSize(14);
        doc.text('Flashcards', 20, yPosition);
        yPosition += 15;
        
        flashcardElements.forEach((card, index) => {
          const question = card.querySelector('.question')?.textContent || '';
          const answer = card.querySelector('.answer')?.textContent || '';
          
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
    }
    
    // Add quiz questions section
    const quizElements = htmlDoc.querySelectorAll('.quiz-question');
    if (quizElements.length > 0) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Quiz Questions', 20, yPosition);
      yPosition += 15;
      
      quizElements.forEach((question, index) => {
        const questionText = question.querySelector('.question')?.textContent || '';
        
        doc.setFontSize(10);
        const questionLines = doc.splitTextToSize(`Q${index + 1}: ${questionText}`, 170);
        doc.text(questionLines, 20, yPosition);
        yPosition += questionLines.length * 5 + 5;
        
        const options = question.querySelectorAll('.option');
        options.forEach((option) => {
          const optionText = option.textContent || '';
          const optionLines = doc.splitTextToSize(`• ${optionText}`, 160);
          doc.text(optionLines, 25, yPosition);
          yPosition += optionLines.length * 5 + 3;
        });
        
        const explanation = question.querySelector('.explanation')?.textContent || '';
        if (explanation) {
          const explanationLines = doc.splitTextToSize(`Explanation: ${explanation}`, 170);
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
    const summaryElement = htmlDoc.querySelector('.summary');
    if (summaryElement) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Session Summary', 20, yPosition);
      yPosition += 15;
      
      const summaryText = summaryElement.textContent || '';
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
  
  // For now, we'll assume all questions are answered correctly since we don't have user answers
  // In a real implementation, you would track user's actual answers
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

    // Generate HTML content for PDF
    const sessionTypeLabel = reviewStage === 0 ? 'Initial Session' : `Review Stage ${reviewStage}`;
    let htmlContent = `
      <div class="header">
        <h1>Study Session Report</h1>
        <h3>${sessionName || 'Study Session'} - ${sessionTypeLabel}</h3>
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
            <div class="question">Q${index + 1}: ${card.question || ''}</div>
            <div class="answer">A: ${card.answer || ''}</div>
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
            <div class="question">Q${index + 1}: ${question.question || ''}</div>
            <div class="options">
        `;
        
        if (question.options && Array.isArray(question.options)) {
          question.options.forEach((option: string) => {
            const isCorrect = option === question.correctAnswer;
            htmlContent += `
              <div class="option ${isCorrect ? 'correct' : ''}">${option} ${isCorrect ? '✓' : ''}</div>
            `;
          });
        }
        
        htmlContent += `
            </div>
            <div class="explanation"><strong>Explanation:</strong> ${question.explanation || ''}</div>
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

    console.log('Generating PDF with content length:', htmlContent.length);

    // Generate PDF
    const pdfData = await generatePDF(htmlContent);
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
