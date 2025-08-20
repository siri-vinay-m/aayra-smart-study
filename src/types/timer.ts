/**
 * Timer-related type definitions
 */

/**
 * Timer types for different study phases
 */
export type TimerType = 'focus' | 'break' | 'longBreak';

/**
 * Timer status states
 */
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

/**
 * Timer configuration interface
 */
export interface TimerConfig {
  focusDuration: number; // in minutes
  breakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsUntilLongBreak: number;
}

/**
 * Timer state interface
 */
export interface TimerState {
  type: TimerType;
  status: TimerStatus;
  timeLeft: number; // in seconds
  totalTime: number; // in seconds
  currentSession: number;
  completedSessions: number;
}

/**
 * Timer settings interface
 */
export interface TimerSettings {
  soundOption: 'none' | 'ticking' | 'piano';
  showAffirmations: boolean;
  focusMode: boolean;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

/**
 * Timer event types
 */
export type TimerEvent = 
  | 'start'
  | 'pause'
  | 'resume'
  | 'stop'
  | 'complete'
  | 'reset'
  | 'skip';

/**
 * Timer callback function type
 */
export type TimerCallback = (event: TimerEvent, state: TimerState) => void;

/**
 * Pomodoro session data
 */
export interface PomodoroSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  type: TimerType;
  duration: number; // in seconds
  completed: boolean;
  interrupted: boolean;
}

/**
 * Timer statistics interface
 */
export interface TimerStats {
  totalFocusTime: number; // in seconds
  totalBreakTime: number; // in seconds
  completedSessions: number;
  averageSessionLength: number; // in seconds
  streakDays: number;
  lastSessionDate: Date | null;
}