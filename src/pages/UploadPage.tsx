
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ImageUpload from '@/components/ui/image-upload';
import VoiceRecorder from '@/components/ui/voice-recorder';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, Link } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const UploadPage = () => {
  const { currentSession, updateCurrentSessionStatus } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedVoice, setUploadedVoice] = useState<Blob | null>(null);
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
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
    materialType: 'image' | 'voice' | 'text' | 'url',
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

      // Save text content
      if (textContent.trim()) {
        await saveUploadedMaterial(
          currentSession.id,
          'text',
          undefined,
          undefined,
          textContent.trim()
        );
      }

      // Save URL content
      if (urlContent.trim()) {
        await saveUploadedMaterial(
          currentSession.id,
          'url',
          undefined,
          undefined,
          urlContent.trim()
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

  const handleImageSelect = (file: File | null) => {
    if (file) {
      handleImageUpload([file]);
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

  // Check if any content exists
  const hasAnyContent = uploadedImages.length > 0 || uploadedVoice !== null || textContent.trim() || urlContent.trim();

  return (
    <MainLayout>
      <div className="px-4 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold mb-2">{currentSession.sessionName}</h1>
          <p className="text-gray-600">Upload your study materials to generate AI content</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
              <FileText size={20} />
              Add Text Content
            </h2>
            <Textarea
              placeholder="Enter your study notes or text content here..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="min-h-[100px]"
            />
            {textContent.trim() && (
              <p className="text-sm text-green-600 mt-2">
                Text content added ({textContent.length} characters)
              </p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
              <Link size={20} />
              Add Link/URL
            </h2>
            <Input
              type="url"
              placeholder="Enter a URL to study material (e.g., article, document, video)"
              value={urlContent}
              onChange={(e) => setUrlContent(e.target.value)}
            />
            {urlContent.trim() && (
              <p className="text-sm text-green-600 mt-2">
                URL link added
              </p>
            )}
          </div>
          
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
        
        <div className="mt-8 flex justify-end">
          <Button
            onClick={processUploadedMaterials}
            disabled={!hasAnyContent || isProcessing}
            className="px-8"
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
        </div>
        
        {!hasAnyContent && (
          <p className="text-sm text-red-500 mt-2 text-center">
            Please add at least one type of content to continue
          </p>
        )}
      </div>
    </MainLayout>
  );
};

export default UploadPage;
