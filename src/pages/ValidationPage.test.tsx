
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
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
    updateCurrentSessionStatus: vi.fn(),
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
    expect(screen.getByRole('button', { name: /Next Card/i })).toBeInTheDocument();
  });

  it('transitions to quiz view after completing flashcards', async () => {
    renderValidationPage();
    
    // Click through flashcards
    // Flashcards are mocked to have 3 items
    let nextButton = screen.getByRole('button', { name: /Next Card/i });
    await act(async () => { fireEvent.click(nextButton); }); // Card 1 -> Card 2
    
    nextButton = screen.getByRole('button', { name: /Next Card/i });
    await act(async () => { fireEvent.click(nextButton); }); // Card 2 -> Card 3
    
    // Now on the last flashcard, button should say "Start Quiz"
    const startQuizButton = screen.getByRole('button', { name: /Start Quiz/i });
    expect(startQuizButton).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(startQuizButton);
    });

    // Verify transition to quiz view
    expect(screen.getByText(/Knowledge Check/i)).toBeInTheDocument(); // Page title for quiz
    expect(screen.getByText(/Quiz Time!/i)).toBeInTheDocument(); // Quiz section title
    expect(screen.getByRole('button', { name: /Submit Quiz & Finish/i })).toBeInTheDocument();
    expect(screen.queryByText(/Flashcard/i)).not.toBeInTheDocument(); // Flashcard counter should be gone
  });

  it('handles "Skip Review" button correctly during flashcards', async () => {
    renderValidationPage();
    const skipButton = screen.getByRole('button', { name: /Skip Review/i });
    await act(async () => {
      fireEvent.click(skipButton);
    });
    expect(mockSetCurrentSession).toHaveBeenCalled(); // Checks if session status update was attempted
    expect(mockNavigate).toHaveBeenCalledWith('/break');
  });
  
  it('handles "Skip Quiz" button correctly during quiz', async () => {
    renderValidationPage();
    // Transition to quiz view first
    let nextButton = screen.getByRole('button', { name: /Next Card/i });
    await act(async () => { fireEvent.click(nextButton); });
    nextButton = screen.getByRole('button', { name: /Next Card/i });
    await act(async () => { fireEvent.click(nextButton); });
    const startQuizButton = screen.getByRole('button', { name: /Start Quiz/i });
    await act(async () => { fireEvent.click(startQuizButton); });

    // Now in quiz view
    const skipQuizButton = screen.getByRole('button', { name: /Skip Quiz/i });
    await act(async () => {
      fireEvent.click(skipQuizButton);
    });
    expect(mockSetCurrentSession).toHaveBeenCalled(); // Called again for skip quiz
    expect(mockNavigate).toHaveBeenCalledWith('/break');
  });

  it('"Submit Quiz & Finish" button completes the session and navigates', async () => {
    renderValidationPage();
    // Transition to quiz view
    let nextButton = screen.getByRole('button', { name: /Next Card/i });
    await act(async () => { fireEvent.click(nextButton); });
    nextButton = screen.getByRole('button', { name: /Next Card/i });
    await act(async () => { fireEvent.click(nextButton); });
    const startQuizButton = screen.getByRole('button', { name: /Start Quiz/i });
    await act(async () => { fireEvent.click(startQuizButton); });

    // In quiz view
    const submitQuizButton = screen.getByRole('button', { name: /Submit Quiz & Finish/i });
    await act(async () => {
      fireEvent.click(submitQuizButton);
    });

    expect(mockSetCurrentSession).toHaveBeenCalled(); // Status update attempt
    expect(mockCompleteSession).toHaveBeenCalledWith(mockCurrentSession.id);
    expect(mockNavigate).toHaveBeenCalledWith('/break');
  });
  
  it('displays "No active session found" if currentSession is null', () => {
    renderValidationPage(null);
    expect(screen.getByText(/No active session found/i)).toBeInTheDocument();
  });
});
