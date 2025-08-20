import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app.config';

/**
 * Custom hook for platform-specific navigation behavior
 * Handles Android back button and iOS swipe-to-go-back
 */
export const useNavigationBehavior = () => {
  const navigate = useNavigate();

  /**
   * Detects if the device is iOS
   */
  const isIOS = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }, []);

  /**
   * Detects if the device is Android
   */
  const isAndroid = useCallback(() => {
    return /Android/.test(navigator.userAgent);
  }, []);

  /**
   * Handles Android back button behavior
   */
  const handleAndroidBackButton = useCallback((event: PopStateEvent) => {
    if (!APP_CONFIG.navigation.androidBackButton || !isAndroid()) return;
    
    // Custom back button logic
    event.preventDefault();
    
    // Check if we can go back in history
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // If no history, go to home
      navigate('/');
    }
  }, [navigate, isAndroid]);

  /**
   * Enables iOS swipe-to-go-back gesture
   */
  const enableIOSSwipeBack = useCallback(() => {
    if (!APP_CONFIG.navigation.iOSSwipeBack || !isIOS()) return;
    
    let startX = 0;
    let startY = 0;
    let isSwipeBack = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isSwipeBack = startX < 20; // Start from left edge
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwipeBack) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - startX;
      const deltaY = Math.abs(currentY - startY);
      
      // Check if it's a horizontal swipe from left edge
      if (deltaX > 50 && deltaY < 50) {
        e.preventDefault();
        navigate(-1);
        isSwipeBack = false;
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [navigate, isIOS]);

  useEffect(() => {
    // Note: Android back button handling is now managed by Capacitor App plugin
    // in useBackButtonHandler hook for better native integration
    
    // Set up iOS swipe back only
    const cleanupSwipe = enableIOSSwipeBack();
    
    return () => {
      if (cleanupSwipe) cleanupSwipe();
    };
  }, [enableIOSSwipeBack]);

  return {
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    canGoBack: window.history.length > 1
  };
};