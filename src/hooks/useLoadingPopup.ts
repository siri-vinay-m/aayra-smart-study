import { useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  message: string;
}

/**
 * Custom hook to manage global loading popup state
 * Provides functions to show/hide loading popup with custom messages
 */
export const useLoadingPopup = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: 'Aayra is working'
  });

  /**
   * Show the loading popup with an optional custom message
   */
  const showLoading = useCallback((message: string = 'Aayra is working') => {
    setLoadingState({
      isLoading: true,
      message
    });
  }, []);

  /**
   * Hide the loading popup
   */
  const hideLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false
    }));
  }, []);

  /**
   * Execute an async function with loading popup
   * Automatically shows loading before execution and hides after completion/error
   * Includes a small delay before hiding to ensure smooth UI transitions
   */
  const withLoading = useCallback(async <T>(
    asyncFunction: () => Promise<T>,
    loadingMessage: string = 'Aayra is working'
  ): Promise<T> => {
    try {
      showLoading(loadingMessage);
      const result = await asyncFunction();
      // Add a small delay to ensure smooth transitions before hiding loading
      await new Promise(resolve => setTimeout(resolve, 300));
      return result;
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  return {
    isLoading: loadingState.isLoading,
    message: loadingState.message,
    showLoading,
    hideLoading,
    withLoading
  };
};

export default useLoadingPopup;