
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
}

const DiscardSessionDialog: React.FC<DiscardSessionDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isValidationPhase = false,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isValidationPhase ? 'Exit Session' : 'Discard Session'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isValidationPhase 
              ? 'Do you want to exit? Session will be marked incomplete.'
              : 'The session will be discarded. This action cannot be undone.'
            }
          </AlertDialogDescription>
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
