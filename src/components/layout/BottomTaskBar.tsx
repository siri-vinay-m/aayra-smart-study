
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Heart, Home, ArrowLeft } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useSessionDiscard } from '@/hooks/useSessionDiscard';
import DiscardSessionDialog from '@/components/dialogs/DiscardSessionDialog';

const BottomTaskBar = () => {
  const location = useLocation();
  const { isAuthenticated } = useUser();
  const {
    showDiscardDialog,
    isInValidationPhase,
    isInBreakPhase,
    handleNavigationAttempt,
    handleDiscardSession,
    handleCancelDiscard,
  } = useSessionDiscard();
  
  const handleFavorites = () => {
    handleNavigationAttempt('/favorites');
  };
  
  const handleHome = () => {
    handleNavigationAttempt('/home');
  };
  
  const handleBack = () => {
    // Special handling for completed sessions and pending reviews pages
    if (location.pathname === '/completed-sessions' || 
        location.pathname === '/pending-reviews') {
      handleNavigationAttempt('/home');
    } else if (location.pathname === '/home') {
      // Navigate to login page when on home page
      handleNavigationAttempt('/login');
    } else {
      handleNavigationAttempt(-1 as any); // This will be handled by the browser's back functionality if no session to discard
    }
  };
  
  return (
    <>
      <div className="bottom-task-bar">
        <button 
          onClick={handleFavorites}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <Heart size={24} className={location.pathname === '/favorites' ? 'text-primary' : 'text-gray-600'} />
        </button>
        
        <button 
          onClick={handleHome}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <Home size={24} className={location.pathname === '/home' ? 'text-primary' : 'text-gray-600'} />
        </button>
        
        <button 
          onClick={handleBack}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
      </div>
      <div className="bottom-task-bar-spacer" />
      
      <DiscardSessionDialog
        open={showDiscardDialog}
        onOpenChange={handleCancelDiscard}
        onConfirm={handleDiscardSession}
        isValidationPhase={isInValidationPhase}
        isBreakPhase={isInBreakPhase}
      />
    </>
  );
};

export default BottomTaskBar;
