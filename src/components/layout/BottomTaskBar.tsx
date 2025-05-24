
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Heart, Home, ArrowLeft } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

const BottomTaskBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();
  
  const handleFavorites = () => {
    navigate('/favorites');
  };
  
  const handleHome = () => {
    navigate('/home');
  };
  
  const handleBack = () => {
    if (location.pathname === '/home') {
      // Navigate to login page when on home page
      navigate('/login');
    } else {
      navigate(-1);
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
    </>
  );
};

export default BottomTaskBar;
