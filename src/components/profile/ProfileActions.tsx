
import React from 'react';
import { Button } from '@/components/ui/button';

interface ProfileActionsProps {
  onSaveProfile: () => Promise<void>;
  onSignOut: () => Promise<void>;
  isLoading: boolean;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({
  onSaveProfile,
  onSignOut,
  isLoading
}) => {
  return (
    <div className="space-y-3">
      <Button 
        onClick={onSaveProfile} 
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save Profile'}
      </Button>
      
      <Button 
        onClick={onSignOut} 
        variant="outline" 
        className="w-full"
      >
        Sign Out
      </Button>
    </div>
  );
};

export default ProfileActions;
