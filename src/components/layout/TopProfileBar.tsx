
import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import AayraLogo from '@/components/ui/aayra-logo';
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
    <div className="top-profile-bar flex items-center px-4 py-2 border-b relative">
      {/* Logo on the left */}
      <div className="flex items-center">
        <AayraLogo size={32} className="flex-shrink-0" />
      </div>
      
      {/* User name in the center */}
      <div className="absolute left-1/2 transform -translate-x-1/2 text-lg font-semibold">
        {user?.displayName || 'User'}
      </div>
      
      {/* Avatar on the right */}
      <div className="ml-auto">
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
    </div>
  );
};

export default TopProfileBar;
