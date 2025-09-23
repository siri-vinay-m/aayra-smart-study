
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from './SessionContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useLoadingPopup } from '@/hooks/useLoadingPopup';
import { useTimerAlerts } from '@/hooks/useTimerAlerts';

export type TimerType = 'focus' | 'break';
type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

interface TimerContextType {
  timerType: TimerType;
  setTimerType: React.Dispatch<React.SetStateAction<TimerType>>;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  status: TimerStatus;
  setStatus: React.Dispatch<React.SetStateAction<TimerStatus>>;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  progress: number;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const FOCUS_TIME = 25 * 60; // 25 minutes in seconds (fallback)
export const BREAK_TIME = 5 * 60; // 5 minutes in seconds (fallback)
export const WARNING_TIME = 5 * 60; // 5 minutes warning in seconds (at 20 minutes)

export const TimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { currentSession, updateCurrentSessionStatus, completeSession } = useSession();
  const { requestNotificationPermission, scheduleNotification } = useNotifications();
  const { withLoading } = useLoadingPopup();
  const { checkForFiveMinuteAlert, resetAlertState } = useTimerAlerts();
  const [timerType, setTimerType] = useState<TimerType>('focus');
  
  const getInitialTime = (type: TimerType) => {
    if (currentSession) {
      return type === 'focus' 
        ? currentSession.focusDurationMinutes * 60
        : currentSession.breakDurationMinutes * 60;
    }
    return type === 'focus' ? FOCUS_TIME : BREAK_TIME;
  };

  const [timeLeft, setTimeLeft] = useState(getInitialTime(timerType));
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [progress, setProgress] = useState(0);

  // Reset timer when session changes or is cancelled
  useEffect(() => {
    const newTime = getInitialTime(timerType);
    setTimeLeft(newTime);
    setStatus('idle');
    setProgress(0);
    resetAlertState();
  }, [currentSession]);

  useEffect(() => {
    const newTime = getInitialTime(timerType);
    setTimeLeft(newTime);
    // Only reset status to idle if timer is not currently running
    setStatus(prevStatus => prevStatus === 'running' ? 'running' : 'idle');
    setProgress(0);
    resetAlertState(); // Reset alert state when timer type changes
  }, [timerType]);

  useEffect(() => {
    const totalTime = getInitialTime(timerType);
    const newProgress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
    console.log('TimerContext: Progress update - timeLeft:', timeLeft, 'totalTime:', totalTime, 'progress:', newProgress);
    setProgress(newProgress);
  }, [timeLeft]);

  useEffect(() => {
    console.log('TimerContext: Timer useEffect triggered - status:', status, 'timeLeft:', timeLeft);
    let interval: number | undefined;

    if (status === 'running') {
      console.log('TimerContext: Starting interval timer');
      // Capture current session values at the time the interval starts
      const sessionAtStart = currentSession;
      const updateStatusAtStart = updateCurrentSessionStatus;
      const completeSessionAtStart = completeSession;
      
      interval = window.setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          console.log('TimerContext: Timer tick - prevTime:', prevTime, 'newTime:', newTime, 'status:', status);
          
          // Check for 5-minute alert during focus sessions
          if (timerType === 'focus') {
            checkForFiveMinuteAlert(prevTime);
          }
          
          // Check if timer completed
          if (newTime <= 0) {
            console.log('TimerContext: Timer completed, triggering completion logic');
            // Use setTimeout to handle completion logic after state update
            setTimeout(async () => {
              console.log('TimerContext: Setting status to completed');
              setStatus('completed');
              playAlarmSound();
              
              if (timerType === 'focus') {
                console.log('TimerContext: Focus timer completed, navigating to upload');
                // Update status to 'uploading' when focus timer completes
                if (sessionAtStart && updateStatusAtStart) {
                  updateStatusAtStart('uploading');
                }
                navigate('/upload');
              } else {
                console.log('TimerContext: Break timer completed, navigating to home');
                // Break timer completed - mark session as completed
                await withLoading(
                  async () => {
                    if (sessionAtStart && updateStatusAtStart) {
                      updateStatusAtStart('completed');
                    }
                    if (sessionAtStart && completeSessionAtStart) {
                      completeSessionAtStart(sessionAtStart.id);
                    }
                    // Add a small delay to ensure the session is properly completed
                    await new Promise(resolve => setTimeout(resolve, 500));
                    navigate('/home');
                  },
                  'Completing session...'
                );
              }
            }, 0);
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        console.log('TimerContext: Clearing interval');
        clearInterval(interval);
      }
    };
  }, [status, timerType, navigate]);

  const startTimer = () => {
    console.log('TimerContext: startTimer called, current status:', status, 'timeLeft:', timeLeft, 'timerType:', timerType);
    if (status !== 'running') {
      console.log('TimerContext: Setting status to running');
      setStatus('running');
      resetAlertState(); // Reset alert state when timer starts
      console.log('TimerContext: Timer started, new status should be running');
    } else {
      console.log('TimerContext: Timer already running, ignoring start request');
    }
  };

  const pauseTimer = () => {
    setStatus('paused');
  };

  const resetTimer = () => {
    setTimeLeft(getInitialTime(timerType));
    setStatus('idle');
    setProgress(0);
    resetAlertState(); // Reset alert state when timer is reset
  };

  const skipTimer = async () => {
    if (!currentSession || !updateCurrentSessionStatus) {
      console.warn("Skip timer called without current session or update function.");
      return;
    }

    setStatus('completed');

    if (timerType === 'focus') {
      // Update status to 'uploading' when focus timer is skipped
      await updateCurrentSessionStatus('uploading');
      navigate('/upload');
    } else {
      // Break timer skipped - mark session as completed
      await updateCurrentSessionStatus('completed');
      if (completeSession) {
        await completeSession(currentSession.id);
      }
      navigate('/home');
    }
  };

  const playBeepSound = () => {
    console.log("Beep sound played - 5 minutes remaining");
  };

  const playAlarmSound = () => {
    // Create audio context and generate alarm sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Set alarm sound properties
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // High frequency for attention
      oscillator.type = 'sine';
      
      // Set volume
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      
      // Play the sound for 1 second
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
      
      console.log("Alarm sound played");
    } catch (error) {
      console.log("Alarm sound played - audio context not supported");
    }
  };

  return (
    <TimerContext.Provider
      value={{
        timerType,
        setTimerType,
        timeLeft,
        setTimeLeft,
        status,
        setStatus,
        startTimer,
        pauseTimer,
        resetTimer,
        skipTimer,
        progress
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

// Export TimerContext for testing
export { TimerContext };
