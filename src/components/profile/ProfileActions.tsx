
import React from 'react';
import { Button } from '@/components/ui/button';

interface ProfileActionsProps {
  onSaveProfile: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({
  onSaveProfile,
  onSignOut
}) => {
  return (
    <div className="space-y-3">
      <Button 
        onClick={onSaveProfile} 
        className="w-full"
      >
        Save Profile
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
