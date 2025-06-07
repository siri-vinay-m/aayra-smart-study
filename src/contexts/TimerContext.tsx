
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from './SessionContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  const { currentSession, updateCurrentSessionStatus, completeSession } = useSession();
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
  const navigate = useNavigate();

  useEffect(() => {
    const newTime = getInitialTime(timerType);
    setTimeLeft(newTime);
    setStatus('idle');
    setProgress(0);
  }, [timerType, currentSession]);

  useEffect(() => {
    const totalTime = getInitialTime(timerType);
    setProgress(totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0);
  }, [timeLeft, timerType, currentSession]);

  useEffect(() => {
    let interval: number | undefined;

    if (status === 'running' && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime === WARNING_TIME && timerType === 'focus') {
            playAlarmSound();
            console.log("Alarm sound played - 5 minutes remaining in focus session");
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && status === 'running') {
      setStatus('completed');
      playAlarmSound();
      
      if (timerType === 'focus') {
        // Update status to 'uploading' when focus timer completes
        if (currentSession && updateCurrentSessionStatus) {
          updateCurrentSessionStatus('uploading');
        }
        navigate('/upload');
      } else {
        // Break timer completed - mark session as completed
        if (currentSession && updateCurrentSessionStatus) {
          updateCurrentSessionStatus('completed');
        }
        if (currentSession && completeSession) {
          completeSession(currentSession.id);
        }
        navigate('/home');
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, timeLeft, timerType, navigate, currentSession, completeSession, updateCurrentSessionStatus]);

  const startTimer = () => {
    setStatus('running');
  };

  const pauseTimer = () => {
    setStatus('paused');
  };

  const resetTimer = () => {
    setTimeLeft(getInitialTime(timerType));
    setStatus('idle');
    setProgress(0);
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
