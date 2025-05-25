
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from './SessionContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type TimerType = 'focus' | 'break';
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

export const FOCUS_TIME = 25 * 60; // 25 minutes in seconds
export const BREAK_TIME = 5 * 60; // 5 minutes in seconds
export const WARNING_TIME = 5 * 60; // 5 minutes warning in seconds (at 20 minutes)

export const TimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentSession, updateCurrentSessionStatus } = useSession(); // Added updateCurrentSessionStatus
  const [timerType, setTimerType] = useState<TimerType>('focus');
  
  // Initialize timeLeft based on currentSession or default
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
  const navigate = useNavigate();

  // Reset timer when type changes or currentSession changes
  useEffect(() => {
    setTimeLeft(getInitialTime(timerType));
    setStatus('idle');
  }, [timerType, currentSession]);

  // Calculate progress
  useEffect(() => {
    const totalTime = getInitialTime(timerType);
    setProgress(totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0);
  }, [timeLeft, timerType, currentSession]);

  // Timer countdown logic
  useEffect(() => {
    let interval: number | undefined;

    if (status === 'running' && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime === WARNING_TIME && timerType === 'focus') {
            playBeepSound();
            toast({
              title: "5 minutes remaining",
              description: "Stay focused, you're almost there!",
              variant: "default",
            });
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && status === 'running') {
      setStatus('completed');
      playAlarmSound();
      
      if (timerType === 'focus') {
        toast({
          title: "Focus session completed!",
          description: "Now let's capture what you've learned.",
          variant: "default",
        });
        navigate('/upload');
      } else {
        toast({
          title: "Break completed!",
          description: "Ready to start another productive session?",
          variant: "default",
        });
        navigate('/');
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, timeLeft, timerType, navigate]);

  const startTimer = () => {
    setStatus('running');
  };

  const pauseTimer = () => {
    setStatus('paused');
  };

  const resetTimer = () => {
    setTimeLeft(getInitialTime(timerType));
    setStatus('idle');
  };

  const skipTimer = async () => { // Made async
    if (!currentSession || !updateCurrentSessionStatus) {
      console.warn("Skip timer called without current session or update function.");
      return;
    }

    setStatus('completed'); // Mark current timer as completed

    if (timerType === 'focus') {
      await updateCurrentSessionStatus('upload_pending');
      // The useEffect for timeLeft === 0 and status === 'running' (now 'completed') already handles navigation
      // However, skipTimer is an explicit action, so direct navigation is fine.
      // The original navigation for completed focus timer was to '/upload'.
      navigate('/upload');
    } else { // timerType === 'break'
      await updateCurrentSessionStatus('focus_pending');
      setTimerType('focus'); // Prepare TimerContext for the next focus session
      // The original navigation for completed break timer was to '/'.
      // Assuming we want to start a new focus session immediately.
      navigate('/focus'); 
    }
  };

  const playBeepSound = () => {
    // In a real implementation, this would play a sound
    console.log("Beep sound played - 5 minutes remaining");
  };

  const playAlarmSound = () => {
    // In a real implementation, this would play a sound
    console.log("Alarm sound played - timer completed");
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
