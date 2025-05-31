
import React from 'react';
import ImageUpload from '@/components/ui/image-upload';
import VoiceRecorder from '@/components/ui/voice-recorder';

interface MaterialUploadSectionProps {
  onImageUpload: (files: File[]) => void;
  onVoiceUpload: (audioBlob: Blob) => void;
  uploadedImages: File[];
  uploadedVoice: Blob | null;
  isUploading: boolean;
}

const MaterialUploadSection: React.FC<MaterialUploadSectionProps> = ({
  onImageUpload,
  onVoiceUpload,
  uploadedImages,
  uploadedVoice,
  isUploading
}) => {
  const handleImageSelect = (file: File | null) => {
    if (file) {
      onImageUpload([file]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-3">Upload Images</h2>
        <ImageUpload
          onFileSelect={handleImageSelect}
          isLoading={isUploading}
        />
        {uploadedImages.length > 0 && (
          <p className="text-sm text-green-600 mt-2">
            {uploadedImages.length} image(s) selected
          </p>
        )}
      </div>
      
      <div>
        <h2 className="text-lg font-medium mb-3">Record Voice Notes</h2>
        <VoiceRecorder
          onRecordingComplete={onVoiceUpload}
        />
        {uploadedVoice && (
          <p className="text-sm text-green-600 mt-2">
            Voice recording ready
          </p>
        )}
      </div>
    </div>
  );
};

export default MaterialUploadSection;
