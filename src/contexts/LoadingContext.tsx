import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import LoadingPopup from '@/components/ui/loading-popup';

interface LoadingContextType {
  isLoading: boolean;
  message: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  withLoading: <T>(asyncFunction: () => Promise<T>, loadingMessage?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

/**
 * Global loading context provider that manages loading state and displays loading popup
 * Provides functions to show/hide loading popup throughout the application
 */
export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Aayra is working');

  /**
   * Show the loading popup with an optional custom message
   */
  const showLoading = useCallback((loadingMessage: string = 'Aayra is working') => {
    setMessage(loadingMessage);
    setIsLoading(true);
  }, []);

  /**
   * Hide the loading popup
   */
  const hideLoading = useCallback(() => {
    setIsLoading(false);
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

  const contextValue: LoadingContextType = {
    isLoading,
    message,
    showLoading,
    hideLoading,
    withLoading
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      <LoadingPopup isOpen={isLoading} message={message} />
    </LoadingContext.Provider>
  );
};

/**
 * Hook to access loading context
 * Must be used within LoadingProvider
 */
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export default LoadingProvider;