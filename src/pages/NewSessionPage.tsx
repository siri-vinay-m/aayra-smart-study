
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from '@/contexts/SessionContext';
import { useToast } from '@/hooks/use-toast';

const NewSessionPage = () => {
  const navigate = useNavigate();
  const { createNewSession, setCurrentSession } = useSession();
  const { toast } = useToast();
  
  const [subjectName, setSubjectName] = useState('');
  const [topicName, setTopicName] = useState('');
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subjectName.trim() || !topicName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both subject and topic names.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const newSession = await createNewSession(subjectName.trim(), topicName.trim(), focusDuration, breakDuration);
      
      if (newSession) {
        // Update the session with focus_in_progress status and set as current
        const updatedSession = {
          ...newSession,
          status: 'focus_in_progress' as const
        };
        setCurrentSession(updatedSession);
        
        // Navigate to focus timer page
        navigate('/focus-timer');
      } else {
        toast({
          title: "Error",
          description: "Failed to create session. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="px-4 max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-6 text-center">Start New Session</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject Name</Label>
            <Input
              id="subject"
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g., Mathematics"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="topic">Topic Name</Label>
            <Input
              id="topic"
              type="text"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="e.g., Calculus"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="focus">Focus Duration (minutes)</Label>
            <Input
              id="focus"
              type="number"
              value={focusDuration}
              onChange={(e) => setFocusDuration(parseInt(e.target.value))}
              min="1"
              max="120"
            />
          </div>
          
          <div>
            <Label htmlFor="break">Break Duration (minutes)</Label>
            <Input
              id="break"
              type="number"
              value={breakDuration}
              onChange={(e) => setBreakDuration(parseInt(e.target.value))}
              min="1"
              max="30"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Session...' : 'Start Session'}
          </Button>
        </form>
      </div>
    </MainLayout>
  );
};

export default NewSessionPage;
