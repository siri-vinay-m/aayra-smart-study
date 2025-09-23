import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useSession } from '@/contexts/SessionContext';
import { useSessionDiscard } from './useSessionDiscard';
import { useToast } from './use-toast';

/**
 * Custom hook to handle hardware back button on mobile devices
 * Prevents unexpected app exits and provides proper navigation flow
 */
export const useBackButtonHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentSession } = useSession();
  const { handleNavigationAttempt } = useSessionDiscard();
  const { toast } = useToast();
  const lastBackPressTime = useRef<number>(0);
  const DOUBLE_BACK_PRESS_INTERVAL = 2000; // 2 seconds

  useEffect(() => {
    // Only handle back button on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleBackButton = () => {
      const currentPath = location.pathname;
      
      // Define navigation hierarchy and safe exit points
      const navigationMap: { [key: string]: string } = {
        '/new-session': '/home',
        '/focus-timer': '/home',
        '/break-timer': '/home',
        '/upload': '/home',
        '/validation': '/home',
        '/profile': '/home',
        '/settings': '/home',
        '/settings/notifications': '/settings',
        '/help': '/home',
        '/completed-sessions': '/home',
        '/incomplete-sessions': '/home',
        '/pending-reviews': '/home',
        '/favorites': '/home',
        '/test-notifications': '/settings',
      };

      // Handle review sessions with dynamic routing
      if (currentPath.startsWith('/review/')) {
        if (currentSession) {
          handleNavigationAttempt('/home');
        } else {
          navigate('/home');
        }
        return;
      }

      // Check if current path has a defined navigation target
      const targetPath = navigationMap[currentPath];
      
      if (targetPath) {
        // If there's an active session, use session discard logic
        if (currentSession && (
          currentPath === '/new-session' ||
          currentPath === '/focus-timer' ||
          currentPath === '/break-timer' ||
          currentPath === '/upload' ||
          currentPath === '/validation'
        )) {
          handleNavigationAttempt(targetPath);
        } else {
          navigate(targetPath);
        }
        return;
      }

      // Handle special cases
      switch (currentPath) {
        case '/home':
          // From home, implement double-tap to exit without logout
          const currentTime = Date.now();
          const timeSinceLastPress = currentTime - lastBackPressTime.current;
          
          if (timeSinceLastPress < DOUBLE_BACK_PRESS_INTERVAL) {
            // Second press within interval - exit app without logout
            App.exitApp();
          } else {
            // First press - show toast and update timestamp
            lastBackPressTime.current = currentTime;
            toast({
              title: "Press again to exit",
              description: "Tap back again to exit the app",
              duration: 2000,
            });
          }
          break;
          
        case '/login':
        case '/register':
        case '/forgot-password':
        case '/reset-password':
          // Allow exit from auth screens
          App.exitApp();
          break;
          
        case '/':
        case '/index':
          // From root/index, exit app
          App.exitApp();
          break;
          
        default:
          // For any other path, go to home
          navigate('/home');
          break;
      }
    };

    // Add back button listener
    const setupListener = async () => {
      const backButtonListener = await App.addListener('backButton', handleBackButton);
      return backButtonListener;
    };
    
    let listenerPromise: Promise<any> | null = null;
    
    if (Capacitor.isNativePlatform()) {
      listenerPromise = setupListener();
    }

    // Cleanup listener on unmount
    return () => {
      if (listenerPromise) {
        listenerPromise.then(listener => listener.remove());
      }
    };
  }, [location.pathname, currentSession, navigate, handleNavigationAttempt, toast]);

  return null;
};