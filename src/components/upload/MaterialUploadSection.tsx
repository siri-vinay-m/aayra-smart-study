
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-3">Upload Images</h2>
        <ImageUpload
          onUpload={onImageUpload}
          uploadedFiles={uploadedImages}
          disabled={isUploading}
        />
      </div>
      
      <div>
        <h2 className="text-lg font-medium mb-3">Record Voice Notes</h2>
        <VoiceRecorder
          onRecordingComplete={onVoiceUpload}
          uploadedRecording={uploadedVoice}
          disabled={isUploading}
        />
      </div>
    </div>
  );
};

export default MaterialUploadSection;
