
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import UploadHeader from '@/components/upload/UploadHeader';
import MaterialUploadSection from '@/components/upload/MaterialUploadSection';
import SubmitSection from '@/components/upload/SubmitSection';
import { useSession } from '@/contexts/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const UploadPage = () => {
  const { currentSession, updateCurrentSessionStatus } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedVoice, setUploadedVoice] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = (files: File[]) => {
    setUploadedImages(files);
  };

  const handleVoiceUpload = (audioBlob: Blob) => {
    setUploadedVoice(audioBlob);
  };

  const uploadToSupabase = async (file: File | Blob, fileName: string, contentType: string) => {
    const { data, error } = await supabase.storage
      .from('study-materials')
      .upload(fileName, file, {
        contentType,
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    return data;
  };

  const saveUploadedMaterial = async (
    sessionId: string,
    materialType: 'image' | 'voice',
    originalFileName?: string,
    fileStoragePath?: string,
    contentText?: string,
    voiceTranscript?: string
  ) => {
    const { error } = await supabase
      .from('uploadedmaterials')
      .insert({
        sessionid: sessionId,
        materialtype: materialType,
        originalfilename: originalFileName,
        filestoragepath: fileStoragePath,
        contenttext: contentText,
        voicetranscript: voiceTranscript
      });

    if (error) {
      console.error('Error saving uploaded material:', error);
      throw error;
    }
  };

  const processUploadedMaterials = async () => {
    if (!currentSession) return;

    setIsProcessing(true);
    
    try {
      // Upload images
      for (const image of uploadedImages) {
        const fileName = `${currentSession.id}/${Date.now()}_${image.name}`;
        await uploadToSupabase(image, fileName, image.type);
        await saveUploadedMaterial(
          currentSession.id,
          'image',
          image.name,
          fileName
        );
      }

      // Upload voice recording
      if (uploadedVoice) {
        const fileName = `${currentSession.id}/${Date.now()}_voice_recording.wav`;
        await uploadToSupabase(uploadedVoice, fileName, 'audio/wav');
        await saveUploadedMaterial(
          currentSession.id,
          'voice',
          'voice_recording.wav',
          fileName
        );
      }

      // Update session status
      await updateCurrentSessionStatus('validating');

      toast({
        title: "Upload Successful",
        description: "Your materials have been uploaded successfully!",
      });

      // Navigate to validation page
      navigate('/validation');

    } catch (error) {
      console.error('Error processing uploads:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your materials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!currentSession) {
    return (
      <MainLayout>
        <div className="px-4 text-center">
          <p className="text-lg text-gray-600">No active session found.</p>
        </div>
      </MainLayout>
    );
  }

  const hasUploadedContent = uploadedImages.length > 0 || uploadedVoice !== null;

  return (
    <MainLayout>
      <div className="px-4 max-w-2xl mx-auto">
        <UploadHeader sessionName={currentSession.sessionName} />
        
        <MaterialUploadSection
          onImageUpload={handleImageUpload}
          onVoiceUpload={handleVoiceUpload}
          uploadedImages={uploadedImages}
          uploadedVoice={uploadedVoice}
          isUploading={isUploading}
        />
        
        <SubmitSection
          onSubmit={processUploadedMaterials}
          isProcessing={isProcessing}
          hasUploadedContent={hasUploadedContent}
        />
      </div>
    </MainLayout>
  );
};

export default UploadPage;
