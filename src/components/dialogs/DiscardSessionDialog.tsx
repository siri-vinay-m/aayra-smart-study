
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DiscardSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isValidationPhase?: boolean;
  isBreakPhase?: boolean;
}

const DiscardSessionDialog: React.FC<DiscardSessionDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isValidationPhase = false,
  isBreakPhase = false,
}) => {
  const getTitle = () => {
    if (isBreakPhase) return 'Complete Session';
    if (isValidationPhase) return 'Exit Session';
    return 'Discard Session';
  };

  const getDescription = () => {
    if (isBreakPhase) return 'Session will be marked complete.';
    if (isValidationPhase) return 'Do you want to exit? Session will be marked incomplete.';
    return 'The session will be discarded. This action cannot be undone.';
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
          <AlertDialogDescription>{getDescription()}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DiscardSessionDialog;
