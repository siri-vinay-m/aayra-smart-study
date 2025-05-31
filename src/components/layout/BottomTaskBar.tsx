
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Heart, Home, ArrowLeft } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useSession } from '@/contexts/SessionContext';
import { useNavigationWithConfirmation } from '@/hooks/useNavigationWithConfirmation';
import DiscardSessionDialog from '@/components/ui/discard-session-dialog';

const BottomTaskBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();
  const { currentSession } = useSession();
  const {
    showDialog,
    handleNavigationRequest,
    handleConfirmDiscard,
    handleCancelDiscard,
  } = useNavigationWithConfirmation();
  
  // Check if we're on pages that should show confirmation
  const shouldShowConfirmation = currentSession && (
    location.pathname === '/focus-timer' || 
    location.pathname === '/upload'
  );
  
  const handleFavorites = () => {
    if (shouldShowConfirmation) {
      handleNavigationRequest('/favorites');
    } else {
      navigate('/favorites');
    }
  };
  
  const handleHome = () => {
    if (shouldShowConfirmation) {
      handleNavigationRequest('/home');
    } else {
      navigate('/home');
    }
  };
  
  const handleBack = () => {
    if (shouldShowConfirmation) {
      handleNavigationRequest('/home');
    } else {
      // Special handling for completed sessions and pending reviews pages
      if (location.pathname === '/completed-sessions' || 
          location.pathname === '/pending-reviews') {
        navigate('/home');
      } else if (location.pathname === '/home') {
        // Navigate to login page when on home page
        navigate('/login');
      } else {
        navigate(-1);
      }
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
        open={showDialog}
        onOpenChange={handleCancelDiscard}
        onConfirm={handleConfirmDiscard}
      />
    </>
  );
};

export default BottomTaskBar;
