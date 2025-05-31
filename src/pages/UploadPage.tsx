
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ImageUpload from '@/components/ui/image-upload';
import VoiceRecorder from '@/components/ui/voice-recorder';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, Upload, Link, Mic } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'text' | 'upload' | 'link' | 'voice'>('text');

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

  const saveTextContent = () => {
    if (textContent.trim()) {
      toast({
        title: "Text Saved",
        description: "Your text content has been saved.",
      });
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
          <h1 className="text-2xl font-semibold mb-2">Upload Study Materials</h1>
          <p className="text-gray-600">Share what you've been studying</p>
        </div>
        
        {/* Tab Icons */}
        <div className="flex justify-center gap-4 mb-6 bg-gray-100 rounded-lg p-2">
          <button
            onClick={() => setActiveTab('text')}
            className={`p-4 rounded-lg transition-colors ${
              activeTab === 'text' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            }`}
          >
            <FileText size={24} className={activeTab === 'text' ? 'text-orange-500' : 'text-gray-600'} />
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`p-4 rounded-lg transition-colors ${
              activeTab === 'upload' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            }`}
          >
            <Upload size={24} className={activeTab === 'upload' ? 'text-orange-500' : 'text-gray-600'} />
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`p-4 rounded-lg transition-colors ${
              activeTab === 'link' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            }`}
          >
            <Link size={24} className={activeTab === 'link' ? 'text-orange-500' : 'text-gray-600'} />
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`p-4 rounded-lg transition-colors ${
              activeTab === 'voice' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            }`}
          >
            <Mic size={24} className={activeTab === 'voice' ? 'text-orange-500' : 'text-gray-600'} />
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-4">
          {activeTab === 'text' && (
            <div>
              <Textarea
                placeholder="Enter your notes or study material..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="min-h-[200px] resize-none border-0 bg-gray-50 focus:bg-white"
              />
              <Button
                onClick={saveTextContent}
                className="w-full mt-4 bg-orange-400 hover:bg-orange-500 text-white"
                disabled={!textContent.trim()}
              >
                <FileText className="mr-2 h-4 w-4" />
                Save Text
              </Button>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="text-center py-8">
              <ImageUpload
                onFileSelect={handleImageSelect}
                isLoading={isUploading}
                className="mx-auto"
              />
              {uploadedImages.length > 0 && (
                <p className="text-sm text-green-600 mt-4">
                  {uploadedImages.length} image(s) uploaded
                </p>
              )}
            </div>
          )}

          {activeTab === 'link' && (
            <div>
              <Input
                type="url"
                placeholder="Paste your link here..."
                value={urlContent}
                onChange={(e) => setUrlContent(e.target.value)}
                className="h-12 border-0 bg-gray-50 focus:bg-white"
              />
              {urlContent.trim() && (
                <p className="text-sm text-green-600 mt-2">
                  URL link added
                </p>
              )}
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="text-center py-8">
              <VoiceRecorder
                onRecordingComplete={handleVoiceUpload}
              />
              {uploadedVoice && (
                <p className="text-sm text-green-600 mt-4">
                  Voice recording ready
                </p>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <Button
            onClick={processUploadedMaterials}
            disabled={!hasAnyContent || isProcessing}
            className="w-full bg-orange-400 hover:bg-orange-500 text-white h-12"
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
