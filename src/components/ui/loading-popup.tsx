import React from 'react';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import AayraLogo from '@/components/ui/aayra-logo';
import { cn } from '@/lib/utils';

interface LoadingPopupProps {
  isOpen: boolean;
  message?: string;
  className?: string;
}

/**
 * Global loading popup component that displays the Aayra logo, spinner, and loading message
 * Used to provide visual feedback during time-consuming operations
 */
const LoadingPopup: React.FC<LoadingPopupProps> = ({ 
  isOpen, 
  message = "Aayra is working", 
  className 
}) => {
  return (
    <DialogPrimitive.Root open={isOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content 
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-sm translate-x-[-50%] translate-y-[-50%] gap-6 border bg-background p-8 shadow-lg duration-200 sm:rounded-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            className
          )}
          // Prevent closing by clicking outside or pressing escape
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center space-y-6 text-center">
            {/* Aayra Logo */}
            <div className="flex justify-center">
              <AayraLogo size={64} className="drop-shadow-sm" />
            </div>
            
            {/* Loading Spinner */}
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
            </div>
            
            {/* Loading Text */}
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">
                {message}
              </p>
              <p className="text-sm text-muted-foreground">
                Please wait...
              </p>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default LoadingPopup;