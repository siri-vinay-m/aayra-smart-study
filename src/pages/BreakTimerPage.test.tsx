import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BreakTimerPage from './BreakTimerPage';
import { SessionContext, StudySession } from '@/contexts/SessionContext';
import { TimerContext } from '@/contexts/TimerContext';
import { vi } from 'vitest';

// Mock the SessionContext
const mockCurrentSession: StudySession = {
  id: 'session123',
  sessionName: 'Test Session',
  subjectName: 'Test Subject',
  topicName: 'Test Topic',
  focusDuration: 25 * 60,
  breakDuration: 5 * 60,
  focusDurationMinutes: 25,
  breakDurationMinutes: 5,
  status: 'break_inprogress',
  startTime: new Date(),
  createdAt: new Date(),
  isFavorite: false,
};

const mockSessionContextValue = {
  currentSession: mockCurrentSession,
  setCurrentSession: vi.fn(),
  completedSessions: [],
  setCompletedSessions: vi.fn(),
  pendingReviews: [],
  setPendingReviews: vi.fn(),
  createNewSession: vi.fn(),
  completeSession: vi.fn(),
  updateCurrentSessionStatus: vi.fn(),
  loadCompletedSessions: vi.fn(),
  loadPendingReviews: vi.fn(),
};

// Mock the TimerContext
const mockTimerContextValue = {
  timerType: 'break',
  setTimerType: vi.fn(),
  isRunning: false,
  setIsRunning: vi.fn(),
  timeRemaining: 300,
  setTimeRemaining: vi.fn(),
  startTimer: vi.fn(),
  pauseTimer: vi.fn(),
  resetTimer: vi.fn(),
};

describe('BreakTimerPage', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <SessionContext.Provider value={mockSessionContextValue}>
          <TimerContext.Provider value={mockTimerContextValue}>
            <BreakTimerPage />
          </TimerContext.Provider>
        </SessionContext.Provider>
      </BrowserRouter>
    );
  });

  it('displays the session name', () => {
    render(
      <BrowserRouter>
        <SessionContext.Provider value={mockSessionContextValue}>
          <TimerContext.Provider value={mockTimerContextValue}>
            <BreakTimerPage />
          </TimerContext.Provider>
        </SessionContext.Provider>
      </BrowserRouter>
    );
    expect(screen.getByText(/Test Session/i)).toBeInTheDocument();
  });

  it('renders the CircularTimer component', () => {
    render(
      <BrowserRouter>
        <SessionContext.Provider value={mockSessionContextValue}>
          <TimerContext.Provider value={mockTimerContextValue}>
            <BreakTimerPage />
          </TimerContext.Provider>
        </SessionContext.Provider>
      </BrowserRouter>
    );
    expect(screen.getByTestId('circular-timer')).toBeInTheDocument();
  });

  it('displays the break message', () => {
    render(
      <BrowserRouter>
        <SessionContext.Provider value={mockSessionContextValue}>
          <TimerContext.Provider value={mockTimerContextValue}>
            <BreakTimerPage />
          </TimerContext.Provider>
        </SessionContext.Provider>
      </BrowserRouter>
    );
    expect(screen.getByText(/Take a well-deserved break!/i)).toBeInTheDocument();
  });
});
