
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import BreakTimerPage from './BreakTimerPage';
import { TimerContext } from '@/contexts/TimerContext';
import { SessionContext, StudySession } from '@/contexts/SessionContext';
import { AuthProvider } from '@/contexts/AuthContext'; // Required by SessionProvider if not mocking SessionContext directly
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

// Mock TimerContext values
const mockSkipTimer = vi.fn();
const mockSetTimerType = vi.fn();
const mockStartTimer = vi.fn(); // For the auto-start effect

// Mock SessionContext values
const mockCurrentSession: StudySession = {
  id: 'session1',
  subjectName: 'Test Subject',
  topicName: 'Test Topic',
  sessionName: 'Test Session',
  status: 'break_pending',
  isFavorite: false,
  focusDuration: 25 * 60,
  breakDuration: 5 * 60,
  focusDurationMinutes: 25,
  breakDurationMinutes: 5,
  startTime: new Date(),
  createdAt: new Date(),
};

const renderBreakTimerPage = (currentSessionOverride?: StudySession | null) => {
  const timerContextValue = {
    timerType: 'break' as const, // Assuming it's already set or will be set
    timeLeft: 300, 
    status: 'idle' as const,
    startTimer: mockStartTimer,
    pauseTimer: vi.fn(),
    resetTimer: vi.fn(),
    skipTimer: mockSkipTimer,
    progress: 0,
    setTimerType: mockSetTimerType,
    setTimeLeft: vi.fn(),
    setStatus: vi.fn(),
  };

  const sessionContextValue = {
    currentSession: currentSessionOverride === undefined ? mockCurrentSession : currentSessionOverride,
    setCurrentSession: vi.fn(),
    completedSessions: [],
    setCompletedSessions: vi.fn(),
    pendingReviews: [],
    setPendingReviews: vi.fn(),
    completeSession: vi.fn(),
    createNewSession: vi.fn(),
    updateCurrentSessionStatus: vi.fn(),
  };
  
  return render(
    <AuthProvider> {/* AuthProvider is a dependency for the real SessionProvider */}
      <SessionContext.Provider value={sessionContextValue}>
        <TimerContext.Provider value={timerContextValue}>
          <BreakTimerPage />
        </TimerContext.Provider>
      </SessionContext.Provider>
    </AuthProvider>
  );
};

describe('BreakTimerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock setTimeout and clearTimeout for controlling useEffect timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders correctly when a session is active', () => {
    renderBreakTimerPage();
    expect(screen.getByText('Break Time')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
    // CircularTimer is rendered with showControls=false, so its buttons aren't here
  });

  it('calls setTimerType("break") and startTimer on mount via useEffect', async () => {
    renderBreakTimerPage();
    
    await act(async () => {
      vi.advanceTimersByTime(150); // Advance timer for the setTimeout in useEffect
    });
    
    expect(mockSetTimerType).toHaveBeenCalledWith('break');
    expect(mockStartTimer).toHaveBeenCalled();
  });

  it('calls skipTimer from TimerContext when its "Skip" button is clicked', async () => {
    renderBreakTimerPage();
    const skipButton = screen.getByRole('button', { name: /skip/i });
    
    await act(async () => {
      fireEvent.click(skipButton);
    });
    
    expect(mockSkipTimer).toHaveBeenCalledTimes(1);
  });

  it('displays "No active session found" when currentSession is null', () => {
    renderBreakTimerPage(null);
    expect(screen.getByText(/no active session found/i)).toBeInTheDocument();
  });
});
