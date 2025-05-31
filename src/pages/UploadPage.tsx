
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ImageUpload from '@/components/ui/image-upload';
import VoiceRecorder from '@/components/ui/voice-recorder';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, Upload, Link, Mic, X, Play, Pause, Save } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SavedMaterial {
  id: string;
  type: 'text' | 'image' | 'url' | 'voice';
  content?: string;
  fileName?: string;
  file?: File;
  audioBlob?: Blob;
  audioUrl?: string;
}

const UploadPage = () => {
  const { currentSession, updateCurrentSessionStatus } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [savedMaterials, setSavedMaterials] = useState<SavedMaterial[]>([]);
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'upload' | 'link' | 'voice'>('text');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const handleImageUpload = (file: File | null) => {
    if (file) {
      const newMaterial: SavedMaterial = {
        id: Date.now().toString(),
        type: 'image',
        fileName: file.name,
        file: file
      };
      setSavedMaterials(prev => [...prev, newMaterial]);
      toast({
        title: "Image Added",
        description: `${file.name} has been added to your materials.`,
      });
    }
  };

  const handleVoiceUpload = (audioBlob: Blob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const newMaterial: SavedMaterial = {
      id: Date.now().toString(),
      type: 'voice',
      fileName: 'voice_recording.wav',
      audioBlob: audioBlob,
      audioUrl: audioUrl
    };
    setSavedMaterials(prev => [...prev, newMaterial]);
    toast({
      title: "Voice Recording Added",
      description: "Your voice recording has been added to your materials.",
    });
  };

  const saveTextContent = () => {
    if (textContent.trim()) {
      const newMaterial: SavedMaterial = {
        id: Date.now().toString(),
        type: 'text',
        content: textContent.trim()
      };
      setSavedMaterials(prev => [...prev, newMaterial]);
      setTextContent('');
      toast({
        title: "Text Saved",
        description: "Your text content has been saved to materials.",
      });
    }
  };

  const saveUrlContent = () => {
    if (urlContent.trim()) {
      const newMaterial: SavedMaterial = {
        id: Date.now().toString(),
        type: 'url',
        content: urlContent.trim()
      };
      setSavedMaterials(prev => [...prev, newMaterial]);
      setUrlContent('');
      toast({
        title: "URL Saved",
        description: "Your URL has been saved to materials.",
      });
    }
  };

  const removeMaterial = (id: string) => {
    setSavedMaterials(prev => prev.filter(material => material.id !== id));
    toast({
      title: "Material Removed",
      description: "The material has been removed from your list.",
    });
  };

  const toggleAudioPlayback = (materialId: string, audioUrl: string) => {
    if (playingAudio === materialId) {
      // Stop current audio
      const audioElement = document.getElementById(`audio-${materialId}`) as HTMLAudioElement;
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      setPlayingAudio(null);
    } else {
      // Stop any currently playing audio
      if (playingAudio) {
        const currentAudio = document.getElementById(`audio-${playingAudio}`) as HTMLAudioElement;
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }
      
      // Play new audio
      const audioElement = document.getElementById(`audio-${materialId}`) as HTMLAudioElement;
      if (audioElement) {
        audioElement.play();
        setPlayingAudio(materialId);
        audioElement.onended = () => setPlayingAudio(null);
      }
    }
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
      for (const material of savedMaterials) {
        if (material.type === 'image' && material.file) {
          const fileName = `${currentSession.id}/${Date.now()}_${material.fileName}`;
          await uploadToSupabase(material.file, fileName, material.file.type);
          await saveUploadedMaterial(
            currentSession.id,
            'image',
            material.fileName,
            fileName
          );
        } else if (material.type === 'voice' && material.audioBlob) {
          const fileName = `${currentSession.id}/${Date.now()}_${material.fileName}`;
          await uploadToSupabase(material.audioBlob, fileName, 'audio/wav');
          await saveUploadedMaterial(
            currentSession.id,
            'voice',
            material.fileName,
            fileName
          );
        } else if (material.type === 'text' && material.content) {
          await saveUploadedMaterial(
            currentSession.id,
            'text',
            undefined,
            undefined,
            material.content
          );
        } else if (material.type === 'url' && material.content) {
          await saveUploadedMaterial(
            currentSession.id,
            'url',
            undefined,
            undefined,
            material.content
          );
        }
      }

      await updateCurrentSessionStatus('validating');

      toast({
        title: "Upload Successful",
        description: "Your materials have been uploaded successfully!",
      });

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

  const hasAnyContent = savedMaterials.length > 0 || textContent.trim() || urlContent.trim();

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
                <Save className="mr-2 h-4 w-4" />
                Save Text
              </Button>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="text-center py-8">
              <ImageUpload
                onFileSelect={handleImageUpload}
                className="mx-auto"
              />
              <p className="text-sm text-gray-500 mt-4">
                Click to upload images or documents
              </p>
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
              <Button
                onClick={saveUrlContent}
                className="w-full mt-4 bg-orange-400 hover:bg-orange-500 text-white"
                disabled={!urlContent.trim()}
              >
                <Save className="mr-2 h-4 w-4" />
                Save URL
              </Button>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="text-center py-8">
              <VoiceRecorder
                onRecordingComplete={handleVoiceUpload}
              />
              <p className="text-sm text-gray-500 mt-4">
                Record your voice notes or explanations
              </p>
            </div>
          )}
        </div>

        {/* Saved Materials List */}
        {savedMaterials.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Saved Materials</h3>
            <div className="space-y-3">
              {savedMaterials.map((material) => (
                <div key={material.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {material.type === 'text' && <FileText size={20} className="text-blue-500" />}
                    {material.type === 'image' && <Upload size={20} className="text-green-500" />}
                    {material.type === 'url' && <Link size={20} className="text-purple-500" />}
                    {material.type === 'voice' && <Mic size={20} className="text-red-500" />}
                    
                    <div className="flex-1">
                      <p className="font-medium">
                        {material.type === 'text' && `Text: ${material.content?.substring(0, 30)}...`}
                        {material.type === 'image' && material.fileName}
                        {material.type === 'url' && material.content}
                        {material.type === 'voice' && material.fileName}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">{material.type}</p>
                    </div>
                    
                    {material.type === 'voice' && material.audioUrl && (
                      <>
                        <audio id={`audio-${material.id}`} src={material.audioUrl} />
                        <Button
                          onClick={() => toggleAudioPlayback(material.id, material.audioUrl!)}
                          variant="outline"
                          size="sm"
                          className="mr-2"
                        >
                          {playingAudio === material.id ? (
                            <Pause size={16} />
                          ) : (
                            <Play size={16} />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => removeMaterial(material.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-8">
          <Button
            onClick={processUploadedMaterials}
            disabled={savedMaterials.length === 0 || isProcessing}
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
        
        {savedMaterials.length === 0 && (
          <p className="text-sm text-red-500 mt-2 text-center">
            Please add at least one material to continue
          </p>
        )}
      </div>
    </MainLayout>
  );
};

export default UploadPage;
