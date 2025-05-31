
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ImageUpload from '@/components/ui/image-upload';
import VoiceRecorder from '@/components/ui/voice-recorder';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
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

  const handleImageSelect = (file: File | null) => {
    if (file) {
      setUploadedImages([file]);
    }
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
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold mb-2">{currentSession.sessionName}</h1>
          <p className="text-gray-600">Upload your study materials to generate AI content</p>
        </div>
        
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
              onRecordingComplete={handleVoiceUpload}
            />
            {uploadedVoice && (
              <p className="text-sm text-green-600 mt-2">
                Voice recording ready
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-8">
          <Button
            onClick={processUploadedMaterials}
            disabled={!hasUploadedContent || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Submit to AI'
            )}
          </Button>
          
          {!hasUploadedContent && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Please upload at least one image or record a voice note to continue
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default UploadPage;
