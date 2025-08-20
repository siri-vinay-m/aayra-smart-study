import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useKeyboardHandler } from './useKeyboardHandler';
import { useBackButtonHandler } from './useBackButtonHandler';

/**
 * Custom hook for mobile-specific features when running as native app
 */
export const useMobileFeatures = () => {
  const [isNative, setIsNative] = useState(false);
  const { scrollToInput } = useKeyboardHandler();
  
  // Initialize back button handler for native platforms
  useBackButtonHandler();

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    
    if (Capacitor.isNativePlatform()) {
      // Configure status bar to prevent full-screen mode
      StatusBar.setStyle({ style: Style.Default });
      StatusBar.setBackgroundColor({ color: 'hsl(var(--background))' });
      StatusBar.setOverlaysWebView({ overlay: false });
      StatusBar.show();
      
      // Hide splash screen after app loads
      SplashScreen.hide();
    }
  }, []);

  /**
   * Provides haptic feedback on supported devices
   */
  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (isNative) {
      await Haptics.impact({ style });
    }
  };

  /**
   * Checks if running on Android
   */
  const isAndroid = () => {
    return Capacitor.getPlatform() === 'android';
  };

  /**
   * Checks if running on iOS
   */
  const isIOS = () => {
    return Capacitor.getPlatform() === 'ios';
  };

  return {
    isNative,
    isAndroid: isAndroid(),
    isIOS: isIOS(),
    triggerHaptic,
    scrollToInput
  };
};