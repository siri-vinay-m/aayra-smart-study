
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { TimerContext, TimerProvider, useTimer, FOCUS_TIME, BREAK_TIME } from './TimerContext';
import { SessionContext, StudySession } from '@/contexts/SessionContext';
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

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock session context
const mockCurrentSession: StudySession = {
  id: 'test-session',
  subjectName: 'Test Subject',
  topicName: 'Test Topic',
  sessionName: 'Test Session',
  sequenceNumber: 1,
  status: 'focus_pending',
  isFavorite: false,
  focusDurationMinutes: 30,
  breakDurationMinutes: 10,
  createdAt: new Date().toISOString(),
  lastReviewedAt: null,
};

const mockUpdateCurrentSessionStatus = vi.fn();

const TestComponent = () => {
  const timer = useTimer();
  return (
    <div>
      <span data-testid="timer-type">{timer.timerType}</span>
      <span data-testid="time-left">{timer.timeLeft}</span>
      <span data-testid="status">{timer.status}</span>
      <button onClick={timer.startTimer}>Start</button>
      <button onClick={timer.pauseTimer}>Pause</button>
      <button onClick={timer.resetTimer}>Reset</button>
      <button onClick={timer.skipTimer}>Skip</button>
    </div>
  );
};

const renderWithProviders = (currentSession = mockCurrentSession) => {
  const sessionContextValue = {
    currentSession,
    setCurrentSession: vi.fn(),
    completedSessions: [],
    setCompletedSessions: vi.fn(),
    pendingReviews: [],
    setPendingReviews: vi.fn(),
    completeSession: vi.fn(),
    loadCompletedSessions: vi.fn(),
    createNewSession: vi.fn(),
    updateCurrentSessionStatus: mockUpdateCurrentSessionStatus,
  };

  return render(
    <SessionContext.Provider value={sessionContextValue}>
      <TimerProvider>
        <TestComponent />
      </TimerProvider>
    </SessionContext.Provider>
  );
};

describe('TimerContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('initializes with correct default values', () => {
    renderWithProviders();
    
    expect(screen.getByTestId('timer-type')).toHaveTextContent('focus');
    expect(screen.getByTestId('time-left')).toHaveTextContent('1800'); // 30 minutes from session
    expect(screen.getByTestId('status')).toHaveTextContent('idle');
  });

  it('uses session durations when available', () => {
    renderWithProviders();
    
    // Should use session's focusDurationMinutes (30) instead of default FOCUS_TIME (25)
    expect(screen.getByTestId('time-left')).toHaveTextContent('1800');
  });

  it('falls back to default times when no session', () => {
    renderWithProviders(null);
    
    // Should use default FOCUS_TIME (25 minutes = 1500 seconds)
    expect(screen.getByTestId('time-left')).toHaveTextContent('1500');
  });

  it('starts timer correctly', async () => {
    renderWithProviders();
    
    const startButton = screen.getByText('Start');
    await act(async () => {
      fireEvent.click(startButton);
    });
    
    expect(screen.getByTestId('status')).toHaveTextContent('running');
  });

  it('pauses timer correctly', async () => {
    renderWithProviders();
    
    const startButton = screen.getByText('Start');
    const pauseButton = screen.getByText('Pause');
    
    await act(async () => {
      fireEvent.click(startButton);
    });
    
    await act(async () => {
      fireEvent.click(pauseButton);
    });
    
    expect(screen.getByTestId('status')).toHaveTextContent('paused');
  });

  it('resets timer correctly', async () => {
    renderWithProviders();
    
    const startButton = screen.getByText('Start');
    const resetButton = screen.getByText('Reset');
    
    await act(async () => {
      fireEvent.click(startButton);
    });
    
    await act(async () => {
      fireEvent.click(resetButton);
    });
    
    expect(screen.getByTestId('status')).toHaveTextContent('idle');
    expect(screen.getByTestId('time-left')).toHaveTextContent('1800'); // Reset to initial time
  });

  it('calls skipTimer function when skip button is clicked', async () => {
    renderWithProviders();
    
    const skipButton = screen.getByText('Skip');
    await act(async () => {
      fireEvent.click(skipButton);
    });
    
    expect(mockUpdateCurrentSessionStatus).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('shows warning toast at 5 minutes remaining', async () => {
    renderWithProviders();
    
    const startButton = screen.getByText('Start');
    await act(async () => {
      fireEvent.click(startButton);
    });
    
    // Fast forward to when there are 5 minutes (300 seconds) left
    const timeToAdvance = (30 * 60 - 5 * 60) * 1000; // 25 minutes in milliseconds
    
    await act(async () => {
      vi.advanceTimersByTime(timeToAdvance);
    });
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "5 minutes remaining",
          description: "Stay focused, you're almost there!",
        })
      );
    });
  });
});
