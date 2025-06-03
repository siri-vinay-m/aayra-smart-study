import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Mic, Upload, Link, FileText, CircleStop, Play, Trash, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAI } from '@/hooks/useAI';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useContentModeration } from '@/hooks/useContentModeration';
import ContentModerationAlert from '@/components/moderation/ContentModerationAlert';

interface UploadItem {
  id: string;
  type: 'text' | 'file' | 'url' | 'voice';
  content: string;
  filename?: string;
  fileSize?: number;
  duration?: number;
}

const UploadPage = () => {
  const { currentSession, setCurrentSession, updateCurrentSessionStatus } = useSession();
  const navigate = useNavigate();
  const { processStudyMaterials, isProcessing } = useAI();
  const { toast } = useToast();
  const { checkContent, isChecking } = useContentModeration();
  
  const [activeTab, setActiveTab] = useState('text');
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedItems, setUploadedItems] = useState<UploadItem[]>([]);
  const [moderationAlert, setModerationAlert] = useState<{ reason: string; category: string } | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  if (!currentSession) {
    return (
      <MainLayout>
        <div className="px-4 text-center">
          <p className="text-lg text-gray-600">No active session found.</p>
        </div>
      </MainLayout>
    );
  }
  
  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleRecordVoice = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };
        
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          setRecordedAudio(audioBlob);
          
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorderRef.current.start();
        setIsRecording(true);
        
        let seconds = 0;
        timerRef.current = window.setInterval(() => {
          seconds++;
          setRecordingTime(seconds);
        }, 1000);
        
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Could not access microphone. Please check your permissions.");
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const playRecording = () => {
    if (recordedAudio && audioRef.current) {
      const audioUrl = URL.createObjectURL(recordedAudio);
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  };
  
  const saveCurrentItem = async () => {
    const id = Date.now().toString();
    let contentToCheck = '';
    let itemType: 'text' | 'file' | 'url' | 'voice' = 'text';
    
    // Prepare content for moderation check
    if (activeTab === 'text' && text.trim()) {
      contentToCheck = text;
      itemType = 'text';
    } else if (activeTab === 'file' && file) {
      contentToCheck = file.name;
      itemType = 'file';
    } else if (activeTab === 'link' && url.trim()) {
      contentToCheck = url;
      itemType = 'url';
    } else if (activeTab === 'voice' && recordedAudio) {
      contentToCheck = 'voice recording content';
      itemType = 'voice';
    } else {
      return; // No content to save
    }
    
    // Check content with moderation system
    const moderationResult = await checkContent(contentToCheck, itemType);
    
    if (!moderationResult.isAppropriate) {
      setModerationAlert({
        reason: moderationResult.reason || 'Content not appropriate for academic use',
        category: moderationResult.category || 'unknown'
      });
      return;
    }
    
    // If content passes moderation, save it
    if (activeTab === 'text' && text.trim()) {
      setUploadedItems([...uploadedItems, {
        id,
        type: 'text',
        content: text
      }]);
      setText('');
    } else if (activeTab === 'file' && file) {
      setUploadedItems([...uploadedItems, {
        id,
        type: 'file',
        content: URL.createObjectURL(file),
        filename: file.name,
        fileSize: file.size
      }]);
      setFile(null);
    } else if (activeTab === 'link' && url.trim()) {
      setUploadedItems([...uploadedItems, {
        id,
        type: 'url',
        content: url
      }]);
      setUrl('');
    } else if (activeTab === 'voice' && recordedAudio) {
      setUploadedItems([...uploadedItems, {
        id,
        type: 'voice',
        content: URL.createObjectURL(recordedAudio),
        duration: recordingTime
      }]);
      setRecordedAudio(null);
      setRecordingTime(0);
    }
    
    toast({
      title: "Content Added",
      description: "Your study material has been added successfully.",
    });
  };
  
  const deleteItem = (id: string) => {
    setUploadedItems(uploadedItems.filter(item => item.id !== id));
  };

  const saveUploadedMaterialToDatabase = async (item: UploadItem) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user || !currentSession) return;

      let materialData: any = {
        sessionid: currentSession.id,
        materialtype: item.type,
        uploadedat: new Date().toISOString(),
      };

      switch (item.type) {
        case 'text':
          materialData.contenttext = item.content;
          break;
        case 'file':
          materialData.originalfilename = item.filename;
          materialData.filesize = item.fileSize;
          materialData.contenttext = `File uploaded: ${item.filename}. This is a study material document.`;
          break;
        case 'url':
          materialData.contenttext = item.content;
          break;
        case 'voice':
          materialData.voicetranscript = 'Voice recording uploaded for transcription.';
          materialData.filesize = item.duration ? item.duration * 1000 : 0;
          break;
      }

      const { error } = await supabase
        .from('uploadedmaterials')
        .insert(materialData);

      if (error) {
        console.error('Error saving material to database:', error);
      } else {
        console.log('Material saved to database successfully');
      }
    } catch (error) {
      console.error('Error in saveUploadedMaterialToDatabase:', error);
    }
  };
  
  const handleSubmit = async () => {
    if (uploadedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one type of content",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Update session status to 'validating' when user clicks "Submit to AI"
      if (currentSession && updateCurrentSessionStatus) {
        await updateCurrentSessionStatus('validating');
      }
      
      console.log('Saving materials to database...');
      
      // Save each uploaded item to the database
      for (const item of uploadedItems) {
        await saveUploadedMaterialToDatabase(item);
      }
      
      console.log('Preparing materials for AI processing...');
      console.log('Uploaded items:', uploadedItems);
      
      // Convert uploadedItems to the format expected by the AI
      const processedMaterials = uploadedItems.map(item => {
        let content = item.content;
        
        // For file types, provide more descriptive content
        if (item.type === 'file' && item.filename) {
          content = `File uploaded: ${item.filename}. This is a study material document that needs to be processed for educational content.`;
        }
        
        return {
          id: item.id,
          type: item.type,
          content: content,
          filename: item.filename
        };
      });
      
      console.log('Processed materials:', processedMaterials);
      
      // Process materials with AI
      const aiResponse = await processStudyMaterials(
        processedMaterials,
        currentSession?.sessionName || 'Study Session'
      );

      if (aiResponse) {
        // Store AI response in session context for validation page
        if (currentSession && setCurrentSession) {
          setCurrentSession({
            ...currentSession,
            status: 'validating',
            aiGeneratedContent: aiResponse
          });
        }
        
        toast({
          title: "Success",
          description: "Study materials processed and saved successfully!",
        });
        
        navigate('/validation');
      } else {
        throw new Error('Failed to process study materials - no response received');
      }
    } catch (error) {
      console.error('Error processing materials:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process study materials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="px-4">
        <h1 className="text-2xl font-semibold mb-2">Upload Study Materials</h1>
        <p className="text-gray-600 mb-6">Share what you've been studying</p>
        
        {moderationAlert && (
          <ContentModerationAlert
            reason={moderationAlert.reason}
            category={moderationAlert.category}
            onDismiss={() => setModerationAlert(null)}
          />
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="text">
              <FileText size={20} />
            </TabsTrigger>
            <TabsTrigger value="file">
              <Upload size={20} />
            </TabsTrigger>
            <TabsTrigger value="link">
              <Link size={20} />
            </TabsTrigger>
            <TabsTrigger value="voice">
              <Mic size={20} />
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="space-y-4">
            <Textarea 
              placeholder="Enter your notes or study material..."
              className="min-h-[200px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Button 
              onClick={saveCurrentItem} 
              className="w-full" 
              disabled={!text.trim() || isChecking}
            >
              <Save size={16} className="mr-2" />
              {isChecking ? 'Checking Content...' : 'Save Text'}
            </Button>
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleUploadFile}
                accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
              />
              <label 
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload size={48} className="text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-gray-400 text-sm">
                  PDF, Images, or Documents
                </p>
              </label>
            </div>
            
            <Button 
              onClick={saveCurrentItem} 
              className="w-full" 
              disabled={!file || isChecking}
            >
              <Save size={16} className="mr-2" />
              {isChecking ? 'Checking Content...' : 'Save File'}
            </Button>
          </TabsContent>
          
          <TabsContent value="link" className="space-y-4">
            <Input 
              placeholder="Paste a URL to study material..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            
            <Button 
              onClick={saveCurrentItem} 
              className="w-full" 
              disabled={!url.trim() || isChecking}
            >
              <Save size={16} className="mr-2" />
              {isChecking ? 'Checking Content...' : 'Save Link'}
            </Button>
          </TabsContent>
          
          <TabsContent value="voice" className="space-y-4">
            <div className="border-2 border-gray-300 rounded-lg p-8 text-center">
              <button
                onClick={handleRecordVoice}
                className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  isRecording ? 'bg-red-500' : 'bg-primary'
                }`}
              >
                {isRecording ? (
                  <CircleStop size={32} className="text-white" />
                ) : (
                  <Mic size={32} className="text-white" />
                )}
              </button>
              
              {isRecording ? (
                <p className="mt-4 text-gray-600">Recording... {formatTime(recordingTime)}</p>
              ) : recordedAudio ? (
                <div className="mt-4">
                  <p className="text-gray-600 mb-2">Recording complete ({formatTime(recordingTime)})</p>
                  <button 
                    onClick={playRecording}
                    className="inline-flex items-center px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    <Play size={16} className="mr-2" />
                    Play
                  </button>
                  <audio ref={audioRef} className="hidden" />
                </div>
              ) : (
                <p className="mt-4 text-gray-600">Tap to start recording</p>
              )}
            </div>
            
            <Button 
              onClick={saveCurrentItem} 
              className="w-full" 
              disabled={!recordedAudio || isChecking}
            >
              <Save size={16} className="mr-2" />
              {isChecking ? 'Checking Content...' : 'Save Recording'}
            </Button>
          </TabsContent>
        </Tabs>
        
        {uploadedItems.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-medium mb-3">Uploaded Materials:</h2>
            <div className="space-y-3">
              {uploadedItems.map(item => (
                <Card key={item.id}>
                  <CardContent className="p-3 flex justify-between items-center">
                    <div>
                      {item.type === 'text' && (
                        <div className="flex items-center">
                          <FileText size={16} className="mr-2" />
                          <span>Text Note ({(item.content.length / 1000).toFixed(1)}k chars)</span>
                        </div>
                      )}
                      {item.type === 'file' && (
                        <div className="flex items-center">
                          <Upload size={16} className="mr-2" />
                          <span>{item.filename} ({(item.fileSize! / 1024).toFixed(1)} KB)</span>
                        </div>
                      )}
                      {item.type === 'url' && (
                        <div className="flex items-center">
                          <Link size={16} className="mr-2" />
                          <span>{item.content}</span>
                        </div>
                      )}
                      {item.type === 'voice' && (
                        <div className="flex items-center">
                          <Mic size={16} className="mr-2" />
                          <span>Voice Recording ({formatTime(item.duration || 0)})</span>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteItem(item.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash size={16} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6">
          <Button 
            onClick={handleSubmit} 
            className="w-full bg-primary hover:bg-primary-dark"
            disabled={isLoading || isProcessing || uploadedItems.length === 0}
          >
            {isLoading || isProcessing ? 'Processing with AI...' : 'Submit to AI'}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default UploadPage;
