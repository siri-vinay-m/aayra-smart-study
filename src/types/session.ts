export type SessionStatus = 'focus_in_progress' | 'uploading' | 'validating' | 'break_in_progress' | 'completed' | 'incomplete';

export interface AIGeneratedContent {
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

export interface StudySession {
  id: string;
  sessionName: string;
  subjectName: string;
  topicName: string;
  focusDuration: number;
  breakDuration: number;
  focusDurationMinutes: number;
  breakDurationMinutes: number;
  status: SessionStatus;
  startTime: Date;
  completedAt?: Date;
  createdAt: Date;
  isFavorite?: boolean;
  aiGeneratedContent?: AIGeneratedContent;
}

export interface PendingReview {
  id: string;
  sessionId: string;
  sessionName: string;
  subjectName: string;
  topicName: string;
  completedAt: Date;
  dueDate: Date;
  reviewStage: string;
  aiGeneratedContent?: AIGeneratedContent;
}
