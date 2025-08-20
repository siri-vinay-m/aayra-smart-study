/**
 * Hook for managing background sounds during focus sessions
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export type SoundOption = 'none' | 'ticking' | 'piano';

interface SoundConfig {
  id: SoundOption;
  name: string;
  file: string;
  loop: boolean;
}

const SOUND_CONFIGS: Record<SoundOption, SoundConfig | null> = {
  none: null,
  ticking: {
    id: 'ticking',
    name: 'Ticking Clock',
    file: '/sounds/ticking-clock.mp3',
    loop: true
  },
  piano: {
    id: 'piano',
    name: 'Relaxing Piano',
    file: '/sounds/relaxing-piano.mp3',
    loop: true
  }
};

/**
 * Custom hook for managing timer background sounds
 * @returns Object containing sound controls and current state
 */
export function useTimerSounds() {
  const [currentSound, setCurrentSound] = useState<SoundOption>('none');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Loads and prepares an audio file
   * @param soundOption - The sound to load
   */
  const loadSound = useCallback((soundOption: SoundOption) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const config = SOUND_CONFIGS[soundOption];
    if (!config) {
      setIsPlaying(false);
      return;
    }

    try {
      const audio = new Audio(config.file);
      audio.loop = config.loop;
      audio.volume = volume;
      
      audio.addEventListener('canplaythrough', () => {
        audioRef.current = audio;
      });

      audio.addEventListener('error', (e) => {
        console.warn(`Failed to load sound: ${config.file}`, e);
        setIsPlaying(false);
      });

      audio.load();
    } catch (error) {
      console.warn(`Error creating audio for ${config.file}:`, error);
      setIsPlaying(false);
    }
  }, [volume]);

  /**
   * Starts playing the current sound
   */
  const playSound = useCallback(async () => {
    if (!audioRef.current || currentSound === 'none') {
      return;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.warn('Failed to play sound:', error);
      setIsPlaying(false);
    }
  }, [currentSound]);

  /**
   * Stops playing the current sound
   */
  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  /**
   * Changes the current sound option
   * @param soundOption - The new sound to use
   */
  const changeSoundOption = useCallback((soundOption: SoundOption) => {
    const wasPlaying = isPlaying;
    
    // Stop current sound
    stopSound();
    
    // Update sound option
    setCurrentSound(soundOption);
    
    // Load new sound if not 'none'
    if (soundOption !== 'none') {
      loadSound(soundOption);
      
      // If we were playing before, start playing the new sound
      if (wasPlaying) {
        // Small delay to ensure audio is loaded
        setTimeout(() => {
          playSound();
        }, 100);
      }
    }
  }, [isPlaying, stopSound, loadSound, playSound]);

  /**
   * Updates the volume for the current sound
   * @param newVolume - Volume level (0-1)
   */
  const changeVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  /**
   * Toggles play/pause for the current sound
   */
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      stopSound();
    } else {
      playSound();
    }
  }, [isPlaying, stopSound, playSound]);

  // Load sound when currentSound changes
  useEffect(() => {
    if (currentSound !== 'none') {
      loadSound(currentSound);
    }
  }, [currentSound, loadSound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    currentSound,
    isPlaying,
    volume,
    playSound,
    stopSound,
    changeSoundOption,
    changeVolume,
    togglePlayPause,
    availableSounds: Object.keys(SOUND_CONFIGS) as SoundOption[],
    getSoundConfig: (option: SoundOption) => SOUND_CONFIGS[option]
  };
}