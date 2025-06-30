/**
 * Hook for managing affirmations display during focus sessions
 */

import { useState, useEffect, useCallback } from 'react';

interface Affirmation {
  id: string;
  text: string;
  category: 'focus' | 'motivation' | 'confidence' | 'productivity';
}

const AFFIRMATIONS: Affirmation[] = [
  { id: '1', text: 'I am focused and productive', category: 'focus' },
  { id: '2', text: 'Every minute of study brings me closer to my goals', category: 'motivation' },
  { id: '3', text: 'I have the ability to learn and understand complex concepts', category: 'confidence' },
  { id: '4', text: 'My mind is clear and ready to absorb new information', category: 'focus' },
  { id: '5', text: 'I am making progress with every study session', category: 'productivity' },
  { id: '6', text: 'Challenges help me grow stronger and smarter', category: 'motivation' },
  { id: '7', text: 'I trust in my ability to succeed', category: 'confidence' },
  { id: '8', text: 'I am building valuable knowledge and skills', category: 'productivity' },
  { id: '9', text: 'My concentration improves with each study session', category: 'focus' },
  { id: '10', text: 'I am committed to my learning journey', category: 'motivation' }
];

/**
 * Custom hook for managing affirmations during study sessions
 * @returns Object containing current affirmation and control functions
 */
export function useAffirmations() {
  const [currentAffirmation, setCurrentAffirmation] = useState<Affirmation | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  /**
   * Gets a random affirmation from the collection
   */
  const getRandomAffirmation = useCallback((): Affirmation => {
    const randomIndex = Math.floor(Math.random() * AFFIRMATIONS.length);
    return AFFIRMATIONS[randomIndex];
  }, []);

  /**
   * Starts the affirmation display cycle
   * @param intervalMinutes - How often to show new affirmations (in minutes)
   */
  const startAffirmations = useCallback((intervalMinutes: number = 5) => {
    if (intervalId) {
      clearInterval(intervalId);
    }

    // Show first affirmation immediately
    setCurrentAffirmation(getRandomAffirmation());
    setIsEnabled(true);

    // Set up interval for subsequent affirmations
    const newIntervalId = setInterval(() => {
      setCurrentAffirmation(getRandomAffirmation());
    }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds

    setIntervalId(newIntervalId);
  }, [intervalId, getRandomAffirmation]);

  /**
   * Stops the affirmation display cycle
   */
  const stopAffirmations = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsEnabled(false);
    setCurrentAffirmation(null);
  }, [intervalId]);

  /**
   * Manually shows the next affirmation
   */
  const nextAffirmation = useCallback(() => {
    if (isEnabled) {
      setCurrentAffirmation(getRandomAffirmation());
    }
  }, [isEnabled, getRandomAffirmation]);

  /**
   * Cleanup interval on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return {
    currentAffirmation,
    isEnabled,
    startAffirmations,
    stopAffirmations,
    nextAffirmation,
    allAffirmations: AFFIRMATIONS
  };
}