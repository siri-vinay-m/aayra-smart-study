
import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

const TopProfileBar = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  
  const handleProfileClick = () => {
    navigate('/profile');
  };
  
  // Get user initials for fallback
  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'U';
  };
  
  return (
    <div className="top-profile-bar flex justify-between items-center px-4 py-2 border-b">
      <div className="text-lg font-semibold">
        {user?.displayName || 'User'}
      </div>
      
      <Avatar 
        className="cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleProfileClick}
      >
        {user?.profilePictureURL && (
          <AvatarImage 
            src={user.profilePictureURL} 
            alt="Profile"
          />
        )}
        <AvatarFallback className="bg-gray-200 text-gray-600">
          {user?.profilePictureURL ? (
            <User size={20} />
          ) : (
            getUserInitials()
          )}
        </AvatarFallback>
      </Avatar>
    </div>
  );
};

export default TopProfileBar;
