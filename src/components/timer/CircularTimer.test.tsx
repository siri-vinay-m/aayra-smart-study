
import React from 'react';
import { render, act } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import CircularTimer from './CircularTimer';
import { TimerContext } from '@/contexts/TimerContext'; // Import the actual context
import { vi } from 'vitest';

// Mock TimerContext values
const mockSkipTimer = vi.fn();
const mockStartTimer = vi.fn();
const mockPauseTimer = vi.fn();
const mockResetTimer = vi.fn();

const renderWithTimerContext = (
  ui: React.ReactElement,
  { providerProps, showControls = true }: { providerProps?: any, showControls?: boolean } = {}
) => {
  const defaultTimerContextValue = {
    timerType: 'focus' as const,
    timeLeft: 1500, // 25 minutes
    status: 'idle' as const,
    startTimer: mockStartTimer,
    pauseTimer: mockPauseTimer,
    resetTimer: mockResetTimer,
    skipTimer: mockSkipTimer,
    progress: 0,
    setTimerType: vi.fn(),
    setTimeLeft: vi.fn(),
    setStatus: vi.fn(),
    ...providerProps?.value, // Allow overriding specific context values
  };
  
  return render(
    <TimerContext.Provider value={defaultTimerContextValue}>
      {React.cloneElement(ui, { showControls })}
    </TimerContext.Provider>
  );
};

describe('CircularTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders timer display', () => {
    renderWithTimerContext(<CircularTimer />);
    expect(screen.getByText('25:00')).toBeInTheDocument(); // Default timeLeft 1500s
    expect(screen.getByText(/focus idle/i)).toBeInTheDocument();
  });

  it('shows controls by default and calls context functions on click', async () => {
    renderWithTimerContext(<CircularTimer />);
    
    // Start button
    const startButton = screen.getByRole('button', { name: /start/i });
    await act(async () => { fireEvent.click(startButton); });
    expect(mockStartTimer).toHaveBeenCalledTimes(1);

    // Reset button
    const resetButton = screen.getByRole('button', { name: /reset/i });
     await act(async () => { fireEvent.click(resetButton); });
    expect(mockResetTimer).toHaveBeenCalledTimes(1);

    // Skip button
    const skipButton = screen.getByRole('button', { name: /skip/i });
    await act(async () => { fireEvent.click(skipButton); });
    expect(mockSkipTimer).toHaveBeenCalledTimes(1);
  });

  it('hides controls when showControls is false', () => {
    renderWithTimerContext(<CircularTimer />, { showControls: false });
    expect(screen.queryByRole('button', { name: /start/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument();
  });
  
  it('displays Pause button when status is running', () => {
    renderWithTimerContext(<CircularTimer />, { providerProps: { value: { status: 'running' } } });
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    expect(pauseButton).toBeInTheDocument();
    fireEvent.click(pauseButton);
    expect(mockPauseTimer).toHaveBeenCalledTimes(1);
  });

  it('displays Resume button when status is paused', () => {
    renderWithTimerContext(<CircularTimer />, { providerProps: { value: { status: 'paused' } } });
    const resumeButton = screen.getByRole('button', { name: /resume/i });
    expect(resumeButton).toBeInTheDocument();
    fireEvent.click(resumeButton);
    expect(mockStartTimer).toHaveBeenCalledTimes(1); // Assuming startTimer handles resume
  });
});
