
import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';

const TopProfileBar = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  
  const handleProfileClick = () => {
    navigate('/profile');
  };
  
  return (
    <div className="top-profile-bar flex justify-between items-center px-4 py-2 border-b">
      <div className="text-lg font-semibold">
        {user?.displayName || 'User'}
      </div>
      
      <div 
        className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer"
        onClick={handleProfileClick}
      >
        {user?.profilePicture ? (
          <img 
            src={user.profilePicture} 
            alt="Profile" 
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-lg font-medium text-gray-600">
            {user?.displayName?.charAt(0) || 'U'}
          </span>
        )}
      </div>
    </div>
  );
};

export default TopProfileBar;
