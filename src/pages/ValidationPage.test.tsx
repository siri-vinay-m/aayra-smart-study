import React from 'react';
import { render, act } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import ValidationPage from './ValidationPage';
import { SessionContext, StudySession } from '@/contexts/SessionContext';
import { AuthProvider } from '@/contexts/AuthContext'; // Required by SessionProvider if not mocking SessionContext directly
import { BrowserRouter } from 'react-router-dom'; // For MainLayout's NavLink etc.
import { vi } from 'vitest';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock SessionContext values
const mockCompleteSession = vi.fn();
const mockSetCurrentSession = vi.fn();
const mockUpdateCurrentSessionStatus = vi.fn();

const mockCurrentSession: StudySession = {
  id: 'session1',
  subjectName: 'Validation Test',
  topicName: 'Flow Control',
  sessionName: 'Validation Test - Flow Control #1',
  status: 'validating', // Initial status for this page
  isFavorite: false,
  focusDuration: 25 * 60,
  breakDuration: 5 * 60,
  focusDurationMinutes: 25,
  breakDurationMinutes: 5,
  startTime: new Date(),
  createdAt: new Date(),
};

const renderValidationPage = (currentSessionOverride?: StudySession | null) => {
  const sessionContextValue = {
    currentSession: currentSessionOverride === undefined ? mockCurrentSession : currentSessionOverride,
    setCurrentSession: mockSetCurrentSession,
    completeSession: mockCompleteSession,
    // Other SessionContext values if needed by ValidationPage directly or its children
    completedSessions: [],
    setCompletedSessions: vi.fn(),
    pendingReviews: [],
    setPendingReviews: vi.fn(),
    createNewSession: vi.fn(),
    updateCurrentSessionStatus: mockUpdateCurrentSessionStatus,
    loadCompletedSessions: vi.fn(),
    loadPendingReviews: vi.fn(),
  };
  
  // ValidationPage uses MainLayout which might have NavLinks or other router-dependent components
  return render(
    <BrowserRouter>
      <AuthProvider> {/* Assuming SessionProvider or a component within MainLayout might need it */}
        <SessionContext.Provider value={sessionContextValue}>
          <ValidationPage />
        </SessionContext.Provider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ValidationPage Screen Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initially renders the flashcards view', () => {
    renderValidationPage();
    expect(screen.getByText(/Review Flashcards/i)).toBeInTheDocument(); // Page title for flashcards
    expect(screen.getByText(/Flashcard 1 of 3/i)).toBeInTheDocument(); // Flashcard counter
    expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
  });

  it('transitions to quiz view after completing flashcards', async () => {
    renderValidationPage();
    
    // Click through flashcards
    // Flashcards are mocked to have 3 items
    let nextButton = screen.getByRole('button', { name: /Next/i });
    await act(async () => { fireEvent.click(nextButton); }); // Card 1 -> Card 2
    
    nextButton = screen.getByRole('button', { name: /Next/i });
    await act(async () => { fireEvent.click(nextButton); }); // Card 2 -> Card 3
    
    // Now on the last flashcard, button should say "Start Quiz"
    const startQuizButton = screen.getByRole('button', { name: /Start Quiz/i });
    expect(startQuizButton).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(startQuizButton);
    });

    // Verify transition to quiz view
    expect(screen.getByText(/Knowledge Check/i)).toBeInTheDocument(); // Page title for quiz
    expect(screen.getByText(/Question 1 of 1/i)).toBeInTheDocument(); // Quiz question counter
    expect(screen.getByRole('button', { name: /Submit Answer/i })).toBeInTheDocument();
  });

  it('handles answer submission in quiz view', async () => {
    renderValidationPage();
    
    // Skip to quiz view
    let nextButton = screen.getByRole('button', { name: /Next/i });
    await act(async () => { fireEvent.click(nextButton); }); // Card 1 -> Card 2
    nextButton = screen.getByRole('button', { name: /Next/i });
    await act(async () => { fireEvent.click(nextButton); }); // Card 2 -> Card 3
    const startQuizButton = screen.getByRole('button', { name: /Start Quiz/i });
    await act(async () => { fireEvent.click(startQuizButton); });
    
    // Select an answer
    const answerOption = screen.getByText(/Topic A/i);
    await act(async () => { fireEvent.click(answerOption); });
    
    // Submit the answer
    const submitButton = screen.getByRole('button', { name: /Submit Answer/i });
    await act(async () => { fireEvent.click(submitButton); });
    
    // Check for explanation
    expect(screen.getByText(/Explanation:/i)).toBeInTheDocument();
    
    // Now there should be a "View Summary" button (last question)
    const viewSummaryButton = screen.getByRole('button', { name: /View Summary/i });
    expect(viewSummaryButton).toBeInTheDocument();
    
    // Click to view summary
    await act(async () => { fireEvent.click(viewSummaryButton); });
    
    // Verify transition to summary view
    expect(screen.getByText(/Session Summary/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Take a Break/i })).toBeInTheDocument();
  });
  
  it('completes the session when "Take a Break" is clicked', async () => {
    renderValidationPage();
    
    // Skip to summary view
    let nextButton = screen.getByRole('button', { name: /Next/i });
    await act(async () => { fireEvent.click(nextButton); }); // Card 1 -> Card 2
    nextButton = screen.getByRole('button', { name: /Next/i });
    await act(async () => { fireEvent.click(nextButton); }); // Card 2 -> Card 3
    const startQuizButton = screen.getByRole('button', { name: /Start Quiz/i });
    await act(async () => { fireEvent.click(startQuizButton); });
    const answerOption = screen.getByText(/Topic A/i);
    await act(async () => { fireEvent.click(answerOption); });
    const submitButton = screen.getByRole('button', { name: /Submit Answer/i });
    await act(async () => { fireEvent.click(submitButton); });
    const viewSummaryButton = screen.getByRole('button', { name: /View Summary/i });
    await act(async () => { fireEvent.click(viewSummaryButton); });
    
    // Click "Take a Break" button
    const takeBreakButton = screen.getByRole('button', { name: /Take a Break/i });
    await act(async () => { fireEvent.click(takeBreakButton); });
    
    // Verify session completion and navigation
    expect(mockSetCurrentSession).toHaveBeenCalledWith({...mockCurrentSession, status: 'break_pending'});
    expect(mockUpdateCurrentSessionStatus).toHaveBeenCalledWith('break_pending');
    expect(mockCompleteSession).toHaveBeenCalledWith(mockCurrentSession.id);
    expect(mockNavigate).toHaveBeenCalledWith('/break');
  });
  
  it('displays "No active session found" if currentSession is null', () => {
    renderValidationPage(null);
    expect(screen.getByText(/No active session found/i)).toBeInTheDocument();
  });
});
