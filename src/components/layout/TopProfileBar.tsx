
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Home, Heart } from 'lucide-react';

interface TopProfileBarProps {
  onNavigationAttempt?: (destination: string) => void;
}

const TopProfileBar: React.FC<TopProfileBarProps> = ({ onNavigationAttempt }) => {
  const navigate = useNavigate();

  const handleNavigation = (destination: string) => {
    if (onNavigationAttempt) {
      onNavigationAttempt(destination);
    } else {
      navigate(destination);
    }
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleNavigation('/home')}
          className="flex items-center gap-2"
        >
          <Home size={20} />
          <span className="hidden sm:inline">Home</span>
        </Button>
        
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation('/favorites')}
            className="flex items-center gap-2"
          >
            <Heart size={20} />
            <span className="hidden sm:inline">Favorites</span>
          </Button>
          
          <Avatar 
            className="h-8 w-8 cursor-pointer" 
            onClick={() => handleNavigation('/profile')}
          >
            <AvatarFallback className="bg-orange-100 text-orange-600">
              U
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
};

export default TopProfileBar;
