import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { cn } from '@/lib/utils';

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

/**
 * Enhanced Input component with mobile keyboard handling
 * Automatically scrolls to input when focused on mobile devices
 */
export const MobileInput = React.forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, onFocus, ...props }, ref) => {
    const { scrollToInput, isNative } = useMobileFeatures();
    const inputRef = useRef<HTMLInputElement>(null);

    // Use forwarded ref or internal ref
    const elementRef = (ref as React.RefObject<HTMLInputElement>) || inputRef;

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      // Call original onFocus if provided
      if (onFocus) {
        onFocus(event);
      }

      // Handle mobile keyboard overlay
      if (isNative && elementRef.current) {
        setTimeout(() => {
          scrollToInput(elementRef.current!);
        }, 100);
      }
    };

    return (
      <Input
        ref={elementRef}
        className={cn(
          'mobile-input',
          className
        )}
        onFocus={handleFocus}
        {...props}
      />
    );
  }
);

MobileInput.displayName = 'MobileInput';

/**
 * Enhanced Textarea component with mobile keyboard handling
 * Automatically scrolls to textarea when focused on mobile devices
 */
export const MobileTextarea = React.forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  ({ className, onFocus, ...props }, ref) => {
    const { scrollToInput, isNative } = useMobileFeatures();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Use forwarded ref or internal ref
    const elementRef = (ref as React.RefObject<HTMLTextAreaElement>) || textareaRef;

    const handleFocus = (event: React.FocusEvent<HTMLTextAreaElement>) => {
      // Call original onFocus if provided
      if (onFocus) {
        onFocus(event);
      }

      // Handle mobile keyboard overlay
      if (isNative && elementRef.current) {
        setTimeout(() => {
          scrollToInput(elementRef.current!);
        }, 100);
      }
    };

    return (
      <Textarea
        ref={elementRef}
        className={cn(
          'mobile-textarea',
          className
        )}
        onFocus={handleFocus}
        {...props}
      />
    );
  }
);

MobileTextarea.displayName = 'MobileTextarea';

/**
 * Hook to manually trigger scroll to input
 * Useful for programmatic focus events
 */
export const useMobileInputFocus = () => {
  const { scrollToInput, isNative } = useMobileFeatures();

  const focusAndScroll = (element: HTMLInputElement | HTMLTextAreaElement) => {
    element.focus();
    if (isNative) {
      setTimeout(() => {
        scrollToInput(element);
      }, 100);
    }
  };

  return { focusAndScroll };
};