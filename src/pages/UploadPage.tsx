
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Mic, Upload, Link, FileText } from 'lucide-react';

const UploadPage = () => {
  const { currentSession, setCurrentSession } = useSession();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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
  
  const handleRecordVoice = () => {
    // In a real implementation, this would use the Web Audio API
    setIsRecording(!isRecording);
  };
  
  const handleSubmit = () => {
    if (!text && !file && !url && !isRecording) {
      alert('Please upload at least one type of content');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      // Update session status
      if (currentSession) {
        setCurrentSession({
          ...currentSession,
          status: 'validating'
        });
      }
      
      setIsLoading(false);
      navigate('/validation');
    }, 2000);
  };
  
  return (
    <MainLayout>
      <div className="px-4">
        <h1 className="text-2xl font-semibold mb-2">Upload Study Materials</h1>
        <p className="text-gray-600 mb-6">Share what you've been studying</p>
        
        <Tabs defaultValue="text">
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
          </TabsContent>
          
          <TabsContent value="link" className="space-y-4">
            <Input 
              placeholder="Paste a URL to study material..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </TabsContent>
          
          <TabsContent value="voice" className="space-y-4">
            <div className="border-2 border-gray-300 rounded-lg p-8 text-center">
              <button
                onClick={handleRecordVoice}
                className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  isRecording ? 'bg-red-500' : 'bg-primary'
                }`}
              >
                <Mic size={32} className="text-white" />
              </button>
              <p className="mt-4 text-gray-600">
                {isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6">
          <Button 
            onClick={handleSubmit} 
            className="w-full bg-primary hover:bg-primary-dark"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Submit to AI'}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default UploadPage;
