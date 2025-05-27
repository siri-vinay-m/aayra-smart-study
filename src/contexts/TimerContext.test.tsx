
import React from 'react';
import { render, act, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TimerProvider, useTimer } from './TimerContext';
import { SessionContext, StudySession } from './SessionContext';
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
  status: 'focus_inprogress',
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

const TestComponent = () => {
  const { timerType, setTimerType } = useTimer();

  return (
    <div>
      <span data-testid="timer-type">{timerType}</span>
      <button onClick={() => setTimerType('break')} data-testid="set-break">Set Break</button>
      <button onClick={() => setTimerType('focus')} data-testid="set-focus">Set Focus</button>
    </div>
  );
};

const renderWithContext = () => {
  return render(
    <BrowserRouter>
      <SessionContext.Provider value={mockSessionContextValue}>
        <TimerProvider>
          <TestComponent />
        </TimerProvider>
      </SessionContext.Provider>
    </BrowserRouter>
  );
};

describe('TimerContext', () => {
  it('should initialize timerType to "focus"', () => {
    renderWithContext();
    expect(screen.getByTestId('timer-type').textContent).toBe('focus');
  });

  it('should update timerType when setTimerType is called', async () => {
    renderWithContext();

    const setBreakButton = screen.getByTestId('set-break');
    await act(async () => {
      fireEvent.click(setBreakButton);
    });

    expect(screen.getByTestId('timer-type').textContent).toBe('break');

    const setFocusButton = screen.getByTestId('set-focus');
    await act(async () => {
      fireEvent.click(setFocusButton);
    });

    expect(screen.getByTestId('timer-type').textContent).toBe('focus');
  });
});
