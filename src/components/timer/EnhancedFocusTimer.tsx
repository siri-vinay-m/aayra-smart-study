/**
 * Enhanced Focus Timer Component
 * Provides advanced Pomodoro features including background sounds, affirmations, and focus mode
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Volume2, Eye, Moon } from 'lucide-react';
import { useTimer } from '@/contexts/TimerContext';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { formatTime } from '@/utils/timeUtils';
import { TimerType } from '@/types/timer';
import { useAffirmations } from '@/hooks/useAffirmations';
import { useNotifications } from '@/hooks/useNotifications';
import { useTimerSounds } from '@/hooks/useTimerSounds';
import { useLoadingPopup } from '@/hooks/useLoadingPopup';

interface EnhancedFocusTimerProps {
  showControls?: boolean;
}

type SoundOption = 'none' | 'ticking' | 'piano';

const EnhancedFocusTimer: React.FC<EnhancedFocusTimerProps> = ({ showControls = true }) => {
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
  
  // Enhanced timer settings state
  const [showSettings, setShowSettings] = useState(false);
  const [soundOption, setSoundOption] = useState<SoundOption>('none');
  const [showAffirmations, setShowAffirmations] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [currentAffirmationGif, setCurrentAffirmationGif] = useState<string>('');
  
  // Audio and wake lock refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  
  // Available GIF files for affirmations
  const affirmationGifs = ['n1.gif', 'w1.gif', 'w2.gif', 'w3.gif'];
  
  // Convert seconds to minutes and seconds
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Calculate circle circumference and stroke-dashoffset
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  
  /**
   * Initialize wake lock to prevent screen from turning off during focus sessions
   */
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && status === 'running') {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('Wake lock activated');
      }
    } catch (error) {
      console.error('Wake lock failed:', error);
    }
  };
  
  /**
   * Release wake lock when timer stops
   */
  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('Wake lock released');
    }
  };
  
  /**
   * Setup background audio based on selected sound option
   */
  const setupAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    if (soundOption !== 'none' && status === 'running') {
      const soundFile = soundOption === 'ticking' ? '/sounds/ticking-clock.mp3' : '/sounds/relaxing-piano.mp3';
      audioRef.current = new Audio(soundFile);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      
      audioRef.current.play().catch(error => {
        console.error('Audio playback failed:', error);
      });
    }
  };
  
  /**
   * Stop background audio
   */
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };
  
  /**
   * Select random affirmation GIF for the session
   */
  const selectRandomAffirmation = () => {
    const randomIndex = Math.floor(Math.random() * affirmationGifs.length);
    setCurrentAffirmationGif(`/gifs/${affirmationGifs[randomIndex]}`);
  };
  
  /**
   * Enable focus mode - hide notifications (except calls)
   */
  const enableFocusMode = async () => {
    if ('Notification' in window && focusMode) {
      // Note: We can't actually block all notifications except calls in web browsers
      // This would need to be implemented at the OS level or in a native app
      console.log('Focus mode enabled - notifications minimized');
    }
  };
  
  // Effect to handle timer status changes
  useEffect(() => {
    if (status === 'running') {
      setupAudio();
      requestWakeLock();
      enableFocusMode();
      
      // Select random affirmation GIF when timer starts
      if (showAffirmations && !currentAffirmationGif) {
        selectRandomAffirmation();
      }
    } else {
      stopAudio();
      releaseWakeLock();
    }
    
    return () => {
      stopAudio();
      releaseWakeLock();
    };
  }, [status, soundOption, showAffirmations]);
  
  // Effect to handle sound option changes
  useEffect(() => {
    if (status === 'running') {
      setupAudio();
    }
  }, [soundOption]);
  
  // Effect to handle affirmation changes
  useEffect(() => {
    if (showAffirmations && status === 'running' && !currentAffirmationGif) {
      selectRandomAffirmation();
    } else if (!showAffirmations) {
      setCurrentAffirmationGif('');
    }
  }, [showAffirmations, status]);
  
  const { showLoading, hideLoading, withLoading } = useLoadingPopup();

  const handleSkip = async () => {
    stopAudio();
    releaseWakeLock();
    
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
  
  const handleStart = () => {
    startTimer();
  };
  
  const handlePause = () => {
    pauseTimer();
    stopAudio();
    releaseWakeLock();
  };
  
  const handleReset = () => {
    resetTimer();
    stopAudio();
    releaseWakeLock();
    setCurrentAffirmationGif('');
  };
  
  // Handle timer completion
  useEffect(() => {
    if (timeLeft === 0 && status === 'completed' && timerType === 'break' && currentSession) {
      completeSession(currentSession.id);
      navigate('/home');
    }
  }, [timeLeft, status, timerType, currentSession, completeSession, navigate]);

  // Handle click away to close settings panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Don't close if clicking inside settings panel
      if (showSettings && settingsRef.current && settingsRef.current.contains(target)) {
        return;
      }
      
      // Don't close if clicking on Select dropdown elements
      if (target.closest('[data-radix-popper-content-wrapper]') || 
          target.closest('[data-radix-select-content]') ||
          target.closest('[data-radix-select-item]') ||
          target.closest('[data-radix-select-trigger]')) {
        return;
      }
      
      // Close settings panel for other clicks
      if (showSettings) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);
  
  return (
    <div className="flex flex-col items-center justify-center relative w-full max-w-sm mx-auto px-4">
      {/* Settings Panel */}
      {showSettings && (
        <Card ref={settingsRef} className="absolute top-0 left-0 right-0 z-10 mb-4 mx-2">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-lg">Timer Settings</h3>
            
            {/* Background Sound Options */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Background Sound</Label>
              <Select value={soundOption} onValueChange={(value: SoundOption) => setSoundOption(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sound option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Sound</SelectItem>
                  <SelectItem value="ticking">Ticking Clock</SelectItem>
                  <SelectItem value="piano">Relaxing Piano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Affirmations Display */}
            <div className="flex items-center justify-between">
              <Label htmlFor="affirmations" className="text-sm font-medium">
                Background Affirmations
              </Label>
              <Switch
                id="affirmations"
                checked={showAffirmations}
                onCheckedChange={setShowAffirmations}
              />
            </div>
            
            {/* Focus Mode */}
            <div className="flex items-center justify-between">
              <Label htmlFor="focus-mode" className="text-sm font-medium">
                Focus Mode (DND)
              </Label>
              <Switch
                id="focus-mode"
                checked={focusMode}
                onCheckedChange={setFocusMode}
              />
            </div>
            
            {/* Active Features Display */}
            <div className="flex flex-wrap gap-2 pt-2">
              {soundOption !== 'none' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Volume2 className="h-3 w-3" />
                  {soundOption === 'ticking' ? 'Ticking' : 'Piano'}
                </Badge>
              )}
              {showAffirmations && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Affirmations
                </Badge>
              )}
              {focusMode && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Moon className="h-3 w-3" />
                  Focus Mode
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Settings Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowSettings(!showSettings)}
        className="absolute top-0 right-0 z-20"
      >
        <Settings className="h-4 w-4" />
      </Button>
      
      {/* Main Timer Display */}
      <div className="circular-timer mt-16">
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
      
      {/* Affirmation Display or Default Text */}
      <div className="mt-8 text-center">
        {showAffirmations && currentAffirmationGif && status === 'running' ? (
          <div className="flex flex-col items-center">
            <img 
              src={currentAffirmationGif} 
              alt="Motivational affirmation" 
              className="w-full max-w-64 h-48 object-cover rounded-lg shadow-lg"
            />
            <p className="mt-4 text-sm text-muted-foreground">Stay focused and motivated!</p>
          </div>
        ) : (
          <div className="text-muted-foreground">
            {currentSession ? (
              <>
                <p>Focus on your study materials.</p>
                <p className="mt-2">You'll be prompted to upload your notes when the timer ends.</p>
              </>
            ) : (
              <>
                <p>Start a focus session to begin studying.</p>
                <p className="mt-2">Create a new session first to track your progress.</p>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Timer Controls */}
      {showControls && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-8 w-full">
          {timerType === 'break' ? (
            <Button
              onClick={handleSkip}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium"
            >
              Complete Session
            </Button>
          ) : (
            <>
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full sm:w-auto px-6 py-3"
              >
                Reset
              </Button>
              
              {status === 'running' ? (
                <Button
                  onClick={handlePause}
                  className="w-full sm:w-auto px-6 py-3"
                >
                  Pause
                </Button>
              ) : (
                <Button
                  onClick={handleStart}
                  className="w-full sm:w-auto px-6 py-3"
                >
                  {status === 'paused' ? 'Resume' : 'Start'}
                </Button>
              )}
              
              <Button
                onClick={handleSkip}
                variant="outline"
                className="w-full sm:w-auto px-6 py-3"
              >
                Skip to Upload
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedFocusTimer;