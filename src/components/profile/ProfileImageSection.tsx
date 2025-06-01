
import React from 'react';
import ImageUpload from '@/components/ui/image-upload';

interface ProfileImageSectionProps {
  profilePictureURL: string;
  onFileSelect: (file: File | null) => void;
  isLoading: boolean;
}

const ProfileImageSection: React.FC<ProfileImageSectionProps> = ({
  profilePictureURL,
  onFileSelect,
  isLoading
}) => {
  return (
    <div className="flex justify-center mb-6">
      <ImageUpload
        currentImageUrl={profilePictureURL}
        onFileSelect={onFileSelect}
        isLoading={isLoading}
        data-testid="profile-image-upload"
      />
    </div>
  );
};

export default ProfileImageSection;
