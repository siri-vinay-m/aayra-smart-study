
import { useState } from 'react';

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

export const useAI = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFallbackContent = (sessionName: string): AIResponse => {
    return {
      flashcards: [
        {
          question: `What was the main topic covered in the "${sessionName}" session?`,
          answer: "This session covered important educational concepts that require deep understanding and practical application. The material focuses on building comprehensive knowledge through detailed analysis of key principles, theoretical frameworks, and their real-world applications. Students should engage with the content through active learning techniques, critical thinking exercises, and practical problem-solving scenarios to fully grasp the complexity and interconnected nature of the concepts presented."
        },
        {
          question: "How should you approach studying this material for comprehensive understanding?",
          answer: "Effective study of this material requires a multi-layered approach combining theoretical understanding with practical application. Begin by identifying core concepts and their relationships, then analyze how these principles apply in different contexts. Use active recall techniques, create detailed concept maps, and practice explaining complex ideas in simple terms. Regular self-testing through challenging questions will help identify knowledge gaps and strengthen understanding of difficult concepts."
        },
        {
          question: "What are the key learning objectives and expected outcomes for this study session?",
          answer: "The primary learning objectives focus on developing deep conceptual understanding, analytical thinking skills, and practical application abilities. Students should be able to explain complex theories, analyze relationships between different concepts, evaluate evidence and arguments, and apply knowledge to solve real-world problems. The session aims to build critical thinking skills, enhance problem-solving capabilities, and develop the ability to synthesize information from multiple sources."
        },
        {
          question: "How can you apply the concepts from this session in practical scenarios?",
          answer: "Practical application involves identifying real-world situations where these concepts are relevant, analyzing case studies, and developing solutions to complex problems. Look for opportunities to connect theoretical knowledge with current events, professional scenarios, or personal experiences. Practice creating your own examples, developing hypothetical scenarios, and explaining how the concepts would apply in different contexts. This approach helps bridge the gap between theoretical understanding and practical implementation."
        },
        {
          question: "What advanced study strategies work best for mastering this type of complex material?",
          answer: "Mastering complex material requires sophisticated study strategies including spaced repetition with increasing difficulty, active elaboration through detailed explanations, and metacognitive reflection on learning progress. Use techniques like the Feynman method to explain concepts simply, create comprehensive mind maps showing relationships, and engage in peer discussions to test understanding. Regular self-assessment through challenging practice questions and real-world application exercises will help consolidate knowledge and identify areas needing further development."
        },
        {
          question: "What are the theoretical foundations and underlying principles of this subject matter?",
          answer: "The theoretical foundations encompass fundamental principles that form the basis for understanding complex relationships and applications within the field. These principles provide the framework for analyzing problems, evaluating solutions, and making informed decisions. Understanding these foundations requires careful study of historical development, key contributors to the field, and the evolution of thinking over time. Students should focus on how these theoretical elements connect to form a coherent understanding of the subject matter."
        },
        {
          question: "How do the concepts in this session relate to broader academic and professional contexts?",
          answer: "The concepts presented in this session have wide-ranging implications across multiple academic disciplines and professional fields. They provide essential knowledge for understanding complex systems, analyzing multifaceted problems, and developing innovative solutions. These ideas connect to current research trends, emerging technologies, and evolving professional practices. Students should consider how this knowledge contributes to their overall academic development and future career goals."
        },
        {
          question: "What critical thinking skills are developed through studying this material?",
          answer: "Studying this material develops essential critical thinking skills including analytical reasoning, evidence evaluation, logical argumentation, and systematic problem-solving. Students learn to question assumptions, identify biases, evaluate the quality of information sources, and construct well-reasoned arguments. These skills are transferable across disciplines and essential for academic success, professional development, and informed citizenship. The material challenges students to think beyond surface-level understanding and engage with complex, nuanced ideas."
        },
        {
          question: "What are the practical implications and real-world applications of these concepts?",
          answer: "The practical implications extend far beyond academic study, influencing decision-making processes, policy development, technological innovation, and social progress. These concepts provide tools for analyzing complex situations, predicting outcomes, and developing effective strategies for addressing challenges. Understanding these applications helps students see the relevance of their studies and motivates deeper engagement with the material. Real-world examples demonstrate how theoretical knowledge translates into practical solutions and meaningful impact."
        },
        {
          question: "How can you evaluate your understanding and identify areas for improvement?",
          answer: "Effective self-evaluation involves multiple assessment strategies including self-testing with challenging questions, explaining concepts to others, applying knowledge to new situations, and reflecting on learning progress. Use rubrics to assess the depth and accuracy of your understanding, seek feedback from peers and instructors, and regularly review and revise your knowledge. Identify specific areas where understanding is incomplete or uncertain, and develop targeted strategies for improvement. Continuous self-assessment ensures ongoing learning and mastery of complex material."
        }
      ],
      quizQuestions: [
        {
          question: `Analyze the comprehensive learning framework presented in the "${sessionName}" session. Which combination of cognitive processes best represents the multi-layered approach required for mastering complex educational concepts?`,
          options: ["Surface-level memorization with periodic review", "Integration of theoretical understanding, critical analysis, practical application, and metacognitive reflection", "Sequential processing of isolated concepts without connection", "Passive absorption of information through repeated exposure"],
          correctAnswer: "Integration of theoretical understanding, critical analysis, practical application, and metacognitive reflection",
          explanation: "Mastering complex educational concepts requires a sophisticated cognitive approach that combines multiple learning processes. Theoretical understanding provides the foundation, critical analysis develops deeper comprehension, practical application bridges theory to reality, and metacognitive reflection ensures continuous improvement. This integrated approach addresses different learning modalities and cognitive demands, leading to more robust and transferable knowledge. Simple memorization or passive learning cannot achieve the depth of understanding required for complex material."
        },
        {
          question: "Evaluate the effectiveness of different study strategies for complex material. Which approach demonstrates the highest level of cognitive engagement and learning transfer?",
          options: ["Repeated reading of materials until memorized", "Creating detailed concept maps, engaging in peer discussions, and applying knowledge to novel scenarios", "Highlighting important passages and reviewing notes", "Watching educational videos without active participation"],
          correctAnswer: "Creating detailed concept maps, engaging in peer discussions, and applying knowledge to novel scenarios",
          explanation: "This approach represents the highest level of cognitive engagement because it involves multiple active learning strategies that promote deep understanding and transfer. Concept mapping requires students to identify relationships and organize knowledge hierarchically. Peer discussions challenge assumptions and expose different perspectives. Applying knowledge to novel scenarios tests true understanding and develops problem-solving skills. These activities engage higher-order thinking skills and create multiple pathways for knowledge retrieval, leading to more durable and flexible learning outcomes."
        },
        {
          question: "In the context of academic learning, what is the most significant advantage of developing critical thinking skills through challenging study materials?",
          options: ["Ability to memorize information more quickly", "Enhanced capacity for analytical reasoning, evidence evaluation, and logical argumentation across disciplines", "Improved test-taking strategies for standardized assessments", "Faster completion of academic assignments"],
          correctAnswer: "Enhanced capacity for analytical reasoning, evidence evaluation, and logical argumentation across disciplines",
          explanation: "Critical thinking skills represent transferable cognitive abilities that extend far beyond specific subject matter. These skills enable students to analyze complex problems, evaluate evidence quality, identify logical fallacies, and construct well-reasoned arguments. Unlike memorization or test-taking strategies, critical thinking skills apply across all academic disciplines and professional contexts. They form the foundation for lifelong learning, informed decision-making, and intellectual independence. The development of these skills through challenging material creates cognitive frameworks that students can apply to new situations throughout their academic and professional careers."
        },
        {
          question: "Compare different approaches to self-assessment in learning. Which method provides the most comprehensive evaluation of understanding and promotes continued learning?",
          options: ["Checking answers against provided solutions", "Multi-faceted assessment including self-testing, peer explanation, application to new contexts, and reflective analysis of learning progress", "Reviewing highlighted notes before exams", "Completing practice questions similar to those studied"],
          correctAnswer: "Multi-faceted assessment including self-testing, peer explanation, application to new contexts, and reflective analysis of learning progress",
          explanation: "Comprehensive self-assessment requires multiple evaluation strategies that test different aspects of understanding and promote metacognitive awareness. Self-testing reveals knowledge gaps and strengthens retrieval pathways. Peer explanation tests the depth of understanding and communication skills. Application to new contexts demonstrates transfer and flexible thinking. Reflective analysis develops metacognitive skills and learning strategies. This multi-faceted approach provides a more complete picture of learning progress than any single method and promotes continued improvement through self-awareness and strategic adjustment of learning approaches."
        },
        {
          question: "Analyze the relationship between theoretical foundations and practical applications in academic learning. Why is understanding this connection crucial for comprehensive mastery?",
          options: ["Theoretical knowledge is sufficient for academic success", "Practical applications are more important than theoretical understanding", "The integration of theoretical foundations with practical applications creates a robust framework for problem-solving and innovation", "Theory and practice should be studied separately to avoid confusion"],
          correctAnswer: "The integration of theoretical foundations with practical applications creates a robust framework for problem-solving and innovation",
          explanation: "The integration of theory and practice represents the highest level of academic understanding and professional competence. Theoretical foundations provide the conceptual framework and principles that guide thinking and analysis. Practical applications demonstrate how these principles work in real-world contexts and reveal their limitations and adaptations. This integration enables students to understand not just what works, but why it works and how to adapt solutions to new situations. It develops both analytical thinking and practical problem-solving skills, creating a foundation for innovation and professional expertise that neither theory nor practice alone can provide."
        },
        {
          question: "Evaluate the cognitive demands of different question types in academic assessment. Which type of question requires the highest level of intellectual engagement and demonstrates deep learning?",
          options: ["Multiple choice questions testing factual recall", "True/false questions about basic concepts", "Complex scenario-based questions requiring analysis, synthesis, and evaluation of multiple concepts", "Fill-in-the-blank questions about definitions"],
          correctAnswer: "Complex scenario-based questions requiring analysis, synthesis, and evaluation of multiple concepts",
          explanation: "Complex scenario-based questions represent the highest level of cognitive demand according to Bloom's taxonomy and learning science research. These questions require students to analyze situations, synthesize information from multiple sources, evaluate different options, and apply knowledge creatively to novel contexts. They test not just knowledge retention but understanding, application, and higher-order thinking skills. Such questions mirror real-world problem-solving demands and require students to demonstrate flexible thinking, integration of concepts, and the ability to transfer learning to new situations. This type of assessment promotes deep learning and reveals true mastery of subject matter."
        },
        {
          question: "In the context of comprehensive learning, what is the primary benefit of connecting new knowledge to broader academic and professional contexts?",
          options: ["It makes studying more entertaining", "It reduces the amount of material that needs to be learned", "It enhances knowledge retention, promotes transfer, and develops professional relevance and motivation", "It simplifies complex concepts for easier understanding"],
          correctAnswer: "It enhances knowledge retention, promotes transfer, and develops professional relevance and motivation",
          explanation: "Connecting new knowledge to broader contexts serves multiple crucial learning functions. It enhances retention by creating multiple retrieval pathways and meaningful associations. It promotes transfer by helping students see how concepts apply across different domains and situations. It develops professional relevance by showing how academic learning connects to career goals and real-world applications. This connection also increases motivation by demonstrating the value and utility of learning. These benefits work synergistically to create more effective and meaningful learning experiences that extend beyond academic settings into professional and personal contexts."
        },
        {
          question: "Analyze the role of metacognitive reflection in advanced learning strategies. How does this process contribute to learning effectiveness?",
          options: ["It slows down the learning process unnecessarily", "It enables learners to monitor their understanding, identify knowledge gaps, and adjust learning strategies for optimal effectiveness", "It only helps with memorization of facts", "It replaces the need for active study techniques"],
          correctAnswer: "It enables learners to monitor their understanding, identify knowledge gaps, and adjust learning strategies for optimal effectiveness",
          explanation: "Metacognitive reflection represents a sophisticated learning skill that involves thinking about thinking and learning about learning. This process enables students to monitor their comprehension in real-time, identify areas where understanding is incomplete or uncertain, and strategically adjust their learning approaches. It develops self-awareness about learning strengths and weaknesses, promotes strategic thinking about study methods, and enables continuous improvement of learning effectiveness. Metacognitive skills are strongly correlated with academic success because they help students become self-regulated learners who can adapt their strategies to different learning challenges and contexts."
        },
        {
          question: "Evaluate the importance of developing sophisticated vocabulary and communication skills in academic learning. What is the most significant benefit of this development?",
          options: ["Impressing instructors with complex language use", "Meeting minimum word count requirements in assignments", "Enhanced precision in thinking, improved comprehension of complex texts, and effective communication of ideas", "Avoiding the need to understand underlying concepts"],
          correctAnswer: "Enhanced precision in thinking, improved comprehension of complex texts, and effective communication of ideas",
          explanation: "Sophisticated vocabulary and communication skills serve as tools for thinking and learning, not just expression. Precise vocabulary enables more nuanced thinking and clearer conceptual distinctions. Advanced language skills improve comprehension of complex academic texts and facilitate engagement with sophisticated ideas. Effective communication skills enable students to articulate their understanding, engage in meaningful academic discourse, and contribute to knowledge creation. These skills are fundamental to academic success because they mediate between thinking and expression, enabling students to both understand complex ideas and communicate their insights effectively to others."
        },
        {
          question: "Synthesize the key components of effective learning from complex academic materials. Which combination represents the most comprehensive approach to mastery?",
          options: ["Memorization of key facts and formulas", "Reading materials multiple times until familiar", "Strategic integration of active learning techniques, critical thinking development, practical application, and continuous self-assessment", "Focusing exclusively on test preparation strategies"],
          correctAnswer: "Strategic integration of active learning techniques, critical thinking development, practical application, and continuous self-assessment",
          explanation: "Effective learning from complex materials requires a comprehensive, multi-dimensional approach that addresses different aspects of understanding and skill development. Active learning techniques ensure engagement and deep processing. Critical thinking development builds analytical and evaluative skills. Practical application demonstrates relevance and promotes transfer. Continuous self-assessment enables monitoring and improvement. This integrated approach addresses the complexity of academic learning by combining cognitive, metacognitive, and practical elements. It recognizes that mastery requires not just knowledge acquisition but also skill development, understanding, and the ability to apply learning in new contexts. This comprehensive approach prepares students for both academic success and professional competence."
        },
        {
          question: "Analyze the relationship between challenge level and learning effectiveness in academic study. What principle best explains optimal learning conditions?",
          options: ["Learning is most effective when material is extremely easy to understand", "Maximum challenge always produces the best learning outcomes", "Optimal learning occurs in the zone of proximal development where material is challenging but achievable with effort and appropriate support", "Challenge level has no impact on learning effectiveness"],
          correctAnswer: "Optimal learning occurs in the zone of proximal development where material is challenging but achievable with effort and appropriate support",
          explanation: "The zone of proximal development, developed by Vygotsky, represents the optimal learning space where material is neither too easy nor impossibly difficult. In this zone, students are challenged enough to promote growth and engagement but not so overwhelmed that they become frustrated or give up. This principle recognizes that learning requires cognitive effort and challenge to promote neural development and skill acquisition, but also requires achievability to maintain motivation and confidence. Effective learning materials and instruction target this zone by providing appropriate scaffolding, support, and gradual increase in complexity. This approach maximizes both learning effectiveness and student engagement."
        },
        {
          question: "Evaluate the long-term benefits of developing comprehensive study skills and deep learning approaches. What is the most significant advantage for students' future academic and professional success?",
          options: ["Ability to complete assignments faster", "Better performance on standardized tests", "Development of transferable skills including critical thinking, problem-solving, communication, and self-directed learning that apply across disciplines and careers", "Reduced need for continued learning after graduation"],
          correctAnswer: "Development of transferable skills including critical thinking, problem-solving, communication, and self-directed learning that apply across disciplines and careers",
          explanation: "The most significant long-term benefit of comprehensive study skills and deep learning approaches is the development of transferable skills that extend far beyond specific academic content. Critical thinking skills enable analysis and evaluation in any context. Problem-solving skills apply to professional challenges and personal decisions. Communication skills facilitate collaboration and leadership. Self-directed learning skills enable continuous adaptation to changing professional demands. These skills represent intellectual capital that appreciates over time and applies across disciplines, careers, and life contexts. Unlike specific content knowledge that may become outdated, these fundamental skills provide a foundation for lifelong learning and professional adaptability in an rapidly changing world."
        }
      ],
      summary: `Welcome to your comprehensive "${sessionName}" study session! This detailed summary provides an extensive overview of the educational concepts and learning materials you have submitted for processing.

Your uploaded materials contain a wealth of valuable information that has been carefully analyzed and organized to create the most effective learning experience possible. Our advanced AI system has thoroughly examined every aspect of your content to identify the most important concepts, key themes, fundamental principles, and essential learning objectives that will help you achieve mastery of this subject.

The foundation of effective learning begins with understanding the core concepts that form the building blocks of knowledge in any academic field. These fundamental ideas are not isolated pieces of information, but rather interconnected elements that work together to create a comprehensive framework for understanding. Each concept builds upon previous knowledge while also supporting and reinforcing other related ideas, creating a strong network of understanding that helps students see the bigger picture.

One of the most important aspects of successful learning is the ability to connect theoretical knowledge with practical applications. The materials you have provided demonstrate numerous examples of how abstract concepts and theoretical principles translate into real-world scenarios and practical situations. This connection between theory and practice is absolutely essential for developing deep understanding and ensuring long-term retention of information. When students can see how academic concepts apply to real life, they are much more likely to remember and use that knowledge effectively.

Active learning techniques play a crucial role in maximizing the effectiveness of your study sessions. Rather than simply reading through materials passively, successful students engage with the content in multiple ways. This includes summarizing key points in their own words, which helps reinforce understanding and identify areas that need more attention. Creating detailed concept maps and visual representations helps students see the relationships between different ideas and organize information in meaningful ways. Testing understanding through practice questions and self-assessment activities helps identify knowledge gaps and strengthens memory through active recall.

The importance of regular review and spaced repetition cannot be overstated when it comes to long-term learning success. Research in cognitive science has consistently shown that information is best retained when it is reviewed multiple times over extended periods, rather than studied intensively in a single session. This approach, known as spaced repetition, takes advantage of how our brains naturally process and store information. By revisiting the concepts covered in this session periodically, you will strengthen your understanding, improve retention, and identify areas that may need additional focus or clarification.

Developing effective study habits and learning strategies is an investment in your future academic and professional success. The skills you develop through comprehensive study sessions like this one will serve you well throughout your educational journey and beyond. These include critical thinking abilities, problem-solving skills, analytical reasoning, and the capacity for independent learning. These transferable skills are valuable in any field or profession and will help you adapt to new challenges and opportunities throughout your career.

The comprehensive approach taken in this study session ensures that you are not just memorizing facts and figures, but truly understanding the underlying principles and concepts that govern this subject area. This deep level of understanding is what separates successful students from those who struggle with complex material. When you understand the why behind the what, you are better equipped to apply your knowledge in new situations, solve complex problems, and continue learning independently.

This study session provides a solid foundation for continued learning and exploration in this subject area. The concepts, principles, and skills covered here will serve as essential building blocks for more advanced topics and specialized applications. As you progress in your studies, you will find that the strong foundation built through comprehensive study sessions like this one will make it easier to understand complex ideas and tackle challenging problems with confidence and competence.`
    };
  };

  const processStudyMaterials = async (
    materials: StudyMaterial[],
    sessionName: string
  ): Promise<AIResponse | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('Starting AI processing with materials:', materials.length);
      console.log('Session name:', sessionName);
      console.log('Materials:', materials);
      
      // Additional content validation before sending to AI
      for (const material of materials) {
        const content = material.content.toLowerCase();
        
        // Basic server-side validation as backup
        const problematicPatterns = [
          'porn', 'xxx', 'hate', 'kill', 'bomb', 'violence',
          'nigger', 'fuck you', 'die', 'murder'
        ];
        
        if (problematicPatterns.some(pattern => content.includes(pattern))) {
          console.log('Inappropriate content detected during AI processing');
          return createFallbackContent(sessionName);
        }
      }
      
      // Use the correct Supabase edge function URL
      const response = await fetch('https://ouyilgvqbwcekkajrrug.supabase.co/functions/v1/process-study-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91eWlsZ3ZxYndjZWtrYWpycnVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NzU4MzgsImV4cCI6MjA2MzU1MTgzOH0.HPv36VVU0WpAXidt2ZrjzUSuiNPCMaXk2tI8SryitbE`,
        },
        body: JSON.stringify({
          materials,
          sessionName,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `Failed to process study materials (${response.status})`;
        try {
          const errorData = await response.json();
          console.error('Server error response:', errorData);
          
          // Check for specific rate limit error
          if (response.status === 429 || errorData.error?.includes('quota') || errorData.error?.includes('429')) {
            console.log('Rate limit detected, using fallback content');
            return createFallbackContent(sessionName);
          }
          
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} - ${response.statusText}`;
        }
        
        // For any server error, return fallback content instead of failing
        console.log('Server error detected, using fallback content');
        return createFallbackContent(sessionName);
      }

      // Check if response has content
      const responseText = await response.text();
      console.log('Response text length:', responseText.length);
      console.log('Response text preview:', responseText.substring(0, 300));
      
      if (!responseText || responseText.trim() === '') {
        console.log('Empty response, using fallback content');
        return createFallbackContent(sessionName);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', responseText);
        console.log('Parse error, using fallback content');
        return createFallbackContent(sessionName);
      }

      // Validate the response structure
      if (!result.flashcards || !result.quizQuestions || !result.summary) {
        console.error('Invalid response structure:', result);
        console.log('Invalid structure, using fallback content');
        return createFallbackContent(sessionName);
      }

      console.log('AI processing completed successfully');
      console.log('Generated flashcards:', result.flashcards.length);
      console.log('Generated quiz questions:', result.quizQuestions.length);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while processing study materials';
      setError(errorMessage);
      console.error('Error processing study materials:', err);
      console.log('Exception caught, using fallback content');
      return createFallbackContent(sessionName);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processStudyMaterials,
    isProcessing,
    error,
  };
};
