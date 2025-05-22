
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
  const [timerType, setTimerType] = useState<TimerType>('focus');
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [progress, setProgress] = useState(0);
  const { currentSession } = useSession();
  const navigate = useNavigate();

  // Reset timer when type changes
  useEffect(() => {
    if (timerType === 'focus') {
      setTimeLeft(FOCUS_TIME);
    } else {
      setTimeLeft(BREAK_TIME);
    }
    setStatus('idle');
  }, [timerType]);

  // Calculate progress
  useEffect(() => {
    const totalTime = timerType === 'focus' ? FOCUS_TIME : BREAK_TIME;
    setProgress((totalTime - timeLeft) / totalTime);
  }, [timeLeft, timerType]);

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
    setTimeLeft(timerType === 'focus' ? FOCUS_TIME : BREAK_TIME);
    setStatus('idle');
  };

  const skipTimer = () => {
    setStatus('completed');
    if (timerType === 'focus') {
      navigate('/upload');
    } else {
      navigate('/');
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
