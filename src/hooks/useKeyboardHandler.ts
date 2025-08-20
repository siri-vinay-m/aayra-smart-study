import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

/**
 * Custom hook to handle mobile keyboard overlay issues
 * Ensures input fields remain visible when keyboard opens
 */
export const useKeyboardHandler = () => {
  const activeElementRef = useRef<HTMLElement | null>(null);
  const originalViewportHeight = useRef<number>(window.innerHeight);

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let keyboardShowListener: any;
    let keyboardHideListener: any;

    const setupKeyboardListeners = async () => {
      // Store original viewport height
      originalViewportHeight.current = window.innerHeight;

      // Listen for keyboard show event
      keyboardShowListener = await Keyboard.addListener('keyboardWillShow', (info) => {
        console.log('Keyboard will show with height:', info.keyboardHeight);
        handleKeyboardShow(info.keyboardHeight);
      });

      // Listen for keyboard hide event
      keyboardHideListener = await Keyboard.addListener('keyboardWillHide', () => {
        console.log('Keyboard will hide');
        handleKeyboardHide();
      });
    };

    /**
     * Handle keyboard show event
     * Adjusts viewport and scrolls to active input
     */
    const handleKeyboardShow = (keyboardHeight: number) => {
      const activeElement = document.activeElement as HTMLElement;
      
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        activeElementRef.current = activeElement;
        
        // Add padding to body to account for keyboard
        document.body.style.paddingBottom = `${keyboardHeight}px`;
        
        // Scroll the active element into view with some offset
        setTimeout(() => {
          const elementRect = activeElement.getBoundingClientRect();
          const viewportHeight = window.innerHeight - keyboardHeight;
          
          // Check if element is hidden behind keyboard
          if (elementRect.bottom > viewportHeight) {
            const scrollOffset = elementRect.bottom - viewportHeight + 50; // 50px buffer
            window.scrollBy({
              top: scrollOffset,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    };

    /**
     * Handle keyboard hide event
     * Restores original viewport
     */
    const handleKeyboardHide = () => {
      // Remove padding from body
      document.body.style.paddingBottom = '';
      activeElementRef.current = null;
    };

    setupKeyboardListeners();

    // Cleanup listeners on unmount
    return () => {
      if (keyboardShowListener) {
        keyboardShowListener.remove();
      }
      if (keyboardHideListener) {
        keyboardHideListener.remove();
      }
      // Reset body padding
      document.body.style.paddingBottom = '';
    };
  }, []);

  /**
   * Manually scroll to an input element
   * Useful for programmatic focus events
   */
  const scrollToInput = (element: HTMLElement) => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    setTimeout(() => {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }, 100);
  };

  return {
    scrollToInput
  };
};