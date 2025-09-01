
import React, { useState, useEffect, useRef } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { Settings, Volume2, VolumeX, Eye, EyeOff, Moon, MoonIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLoadingPopup } from '@/hooks/useLoadingPopup';

interface CircularTimerProps {
  showControls?: boolean;
}

const CircularTimer: React.FC<CircularTimerProps> = ({ showControls = true }) => {
  const { 
    timerType, 
    timeLeft, 
    status, 
    startTimer, 
    pauseTimer, 
    resetTimer, 
    skipTimer,
    progress 
  } = useTimer();
  
  const { currentSession, completeSession } = useSession();
  const navigate = useNavigate();

  // Removed auto-start logic - now handled at page level

  // Convert seconds to minutes and seconds
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Debug log to see if timeLeft is updating in the UI
  console.log('CircularTimer: timeLeft:', timeLeft, 'status:', status, 'formattedTime:', formattedTime);

  // Calculate circle circumference and stroke-dashoffset
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const { showLoading, hideLoading, withLoading } = useLoadingPopup();

  const handleSkip = async () => {
    if (timerType === 'break' && currentSession) {
      await withLoading(
        async () => {
          completeSession(currentSession.id);
          // Add a small delay to ensure the session is properly completed
          await new Promise(resolve => setTimeout(resolve, 500));
          navigate('/home');
        },
        'Completing session...'
      );
    } else {
      skipTimer();
    }
  };

  // Handle timer completion - this will be called when timer reaches 0
  React.useEffect(() => {
    if (timeLeft === 0 && status === 'completed' && timerType === 'break' && currentSession) {
      // Complete the session when break timer ends
      completeSession(currentSession.id);
      navigate('/home');
    }
  }, [timeLeft, status, timerType, currentSession, completeSession, navigate]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="circular-timer">
        <svg width="100%" height="100%" viewBox="0 0 220 220" className="rotate-[-90deg]">
          {/* Background circle */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-semibold">{formattedTime}</div>
          <div className="text-sm text-muted-foreground mt-2 capitalize">
            {timerType} {status === 'running' ? 'in progress' : status}
          </div>
        </div>
      </div>

      {showControls && (
        <div className="flex items-center justify-center gap-6 mt-8">
          {timerType === 'break' ? (
            // Only show skip button during break
            <button
              onClick={handleSkip}
              className="px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
            >
              Complete Session
            </button>
          ) : (
            // Show full controls during focus timer
            <>
              <button
                onClick={resetTimer}
                className="px-6 py-3 rounded-lg bg-muted hover:bg-accent text-foreground font-medium transition-colors"
              >
                Reset
              </button>

              {status === 'running' ? (
                <button
                  onClick={pauseTimer}
                  className="px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium transition-colors"
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={startTimer}
                  className="px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium transition-colors"
                >
                  {status === 'paused' ? 'Resume' : 'Start'}
                </button>
              )}

              <button
                onClick={handleSkip}
                className="px-6 py-3 rounded-lg bg-muted hover:bg-accent text-foreground font-medium transition-colors"
              >
                Skip to Upload
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CircularTimer;
