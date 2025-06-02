
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from '@/contexts/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { useSessionLimits } from '@/hooks/useSessionLimits';
import { AlertCircle, Clock } from 'lucide-react';

const NewSessionPage = () => {
  const navigate = useNavigate();
  const { createNewSession, setCurrentSession } = useSession();
  const { toast } = useToast();
  const sessionLimits = useSessionLimits();
  
  const [subjectName, setSubjectName] = useState('');
  const [topicName, setTopicName] = useState('');
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionLimits.canCreateSession) {
      toast({
        title: "Session Limit Reached",
        description: "You have reached your session limit for today or this week.",
        variant: "destructive"
      });
      return;
    }
    
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
        // Increment session count
        await (sessionLimits as any).incrementSessionCount();
        
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

  const renderSessionLimitInfo = () => {
    if (sessionLimits.isLoading) {
      return (
        <div className="bg-gray-50 border rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={16} />
            <span>Loading session limits...</span>
          </div>
        </div>
      );
    }

    if (!sessionLimits.canCreateSession) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertCircle size={16} />
            <span className="font-medium">Session Limit Reached</span>
          </div>
          <p className="text-red-600 text-sm">
            You have reached your session limit. 
            {sessionLimits.dailyLimit && sessionLimits.sessionsUsedToday >= sessionLimits.dailyLimit && 
              ` Daily limit: ${sessionLimits.sessionsUsedToday}/${sessionLimits.dailyLimit}`}
            {sessionLimits.weeklyLimit && sessionLimits.sessionsUsedThisWeek >= sessionLimits.weeklyLimit && 
              ` Weekly limit: ${sessionLimits.sessionsUsedThisWeek}/${sessionLimits.weeklyLimit}`}
          </p>
        </div>
      );
    }

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-blue-700 mb-2">
          <Clock size={16} />
          <span className="font-medium">Session Usage</span>
        </div>
        <div className="text-blue-600 text-sm space-y-1">
          {sessionLimits.dailyLimit && (
            <p>Today: {sessionLimits.sessionsUsedToday}/{sessionLimits.dailyLimit} sessions</p>
          )}
          {sessionLimits.weeklyLimit && (
            <p>This week: {sessionLimits.sessionsUsedThisWeek}/{sessionLimits.weeklyLimit} sessions</p>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <MainLayout>
      <div className="px-4 max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-6 text-center">Start New Session</h1>
        
        {renderSessionLimitInfo()}
        
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
              disabled={!sessionLimits.canCreateSession}
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
              disabled={!sessionLimits.canCreateSession}
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
              disabled={!sessionLimits.canCreateSession}
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
              disabled={!sessionLimits.canCreateSession}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading || !sessionLimits.canCreateSession}
          >
            {isLoading ? 'Creating Session...' : 
             !sessionLimits.canCreateSession ? 'Session Limit Reached' : 
             'Start Session'}
          </Button>
        </form>
      </div>
    </MainLayout>
  );
};

export default NewSessionPage;
