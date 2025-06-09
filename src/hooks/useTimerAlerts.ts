import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for managing in-session timer alerts and sound notifications
 */
export const useTimerAlerts = () => {
  const { toast } = useToast();
  const audioContextRef = useRef<AudioContext | null>(null);
  const alertShownRef = useRef<boolean>(false);

  /**
   * Initialize audio context for sound alerts
   */
  const initAudioContext = (): AudioContext | null => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.error('Error initializing audio context:', error);
        return null;
      }
    }
    return audioContextRef.current;
  };

  /**
   * Play end-of-session sound alert
   */
  const playEndSessionSound = (): void => {
    try {
      const audioContext = initAudioContext();
      if (!audioContext) return;

      // Create a distinct end-of-session sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create a more complex sound pattern for end-of-session
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.15);
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.3);
      oscillator.frequency.setValueAtTime(900, audioContext.currentTime + 0.45);
      
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.6);
    } catch (error) {
      console.error('Error playing end session sound:', error);
    }
  };

  /**
   * Show 5-minute warning alert with sound
   */
  const showFiveMinuteAlert = (): void => {
    if (alertShownRef.current) return; // Prevent duplicate alerts
    
    alertShownRef.current = true;
    
    // Play sound alert
    playEndSessionSound();
    
    // Show toast notification
    toast({
      title: "⏳ 5 minutes left",
      description: "Wrap it up strong!",
      duration: 5000,
    });
  };

  /**
   * Reset alert state (call when timer starts/resets)
   */
  const resetAlertState = (): void => {
    alertShownRef.current = false;
  };

  /**
   * Check if 5-minute alert should be triggered
   * @param remainingTime - Remaining time in seconds
   */
  const checkForFiveMinuteAlert = (remainingTime: number): void => {
    // Trigger alert when exactly 5 minutes (300 seconds) remain
    if (remainingTime <= 300 && remainingTime > 299 && !alertShownRef.current) {
      showFiveMinuteAlert();
    }
  };

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    checkForFiveMinuteAlert,
    resetAlertState,
    showFiveMinuteAlert,
    playEndSessionSound
  };
};