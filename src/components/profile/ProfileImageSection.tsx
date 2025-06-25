
import React from 'react';
import ImageUpload from '@/components/ui/image-upload';

interface ProfileImageSectionProps {
  profilePictureURL: string;
  onFileSelect: (file: File | null) => void;
}

const ProfileImageSection: React.FC<ProfileImageSectionProps> = ({
  profilePictureURL,
  onFileSelect
}) => {
  return (
    <div className="flex justify-center mb-6">
      <ImageUpload
        currentImageUrl={profilePictureURL}
        onFileSelect={onFileSelect}
        data-testid="profile-image-upload"
      />
    </div>
  );
};

export default ProfileImageSection;
