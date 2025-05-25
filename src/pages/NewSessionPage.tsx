
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { useTimer } from '@/contexts/TimerContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const NewSessionPage = () => {
  const [subjectName, setSubjectName] = useState('');
  const [topicName, setTopicName] = useState('');
  const navigate = useNavigate();
  const { setCurrentSession } = useSession();
  const { setTimerType } = useTimer();
  
  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subjectName || !topicName) return;
    
    // Create a new session
    const newSession = {
      id: Date.now().toString(),
      subjectName,
      topicName,
      sessionName: `${subjectName} - ${topicName} #1`,
      sequenceNumber: 1,
      status: 'focus_inprogress' as const,
      isFavorite: false,
      focusDurationMinutes: 25,
      breakDurationMinutes: 5,
      createdAt: new Date().toISOString(),
      lastReviewedAt: null
    };
    
    setCurrentSession(newSession);
    setTimerType('focus');
    navigate('/focus');
  };
  
  return (
    <MainLayout>
      <div className="px-4">
        <h1 className="text-2xl font-semibold mb-6">Start New Session</h1>
        
        <form onSubmit={handleStartSession} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Name</Label>
            <Input
              id="subject"
              type="text"
              placeholder="e.g. Mathematics"
              required
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="topic">Topic Name</Label>
            <Input
              id="topic"
              type="text"
              placeholder="e.g. Calculus"
              required
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary-dark text-white"
            disabled={!subjectName || !topicName}
          >
            Start Focus Timer
          </Button>
        </form>
      </div>
    </MainLayout>
  );
};

export default NewSessionPage;
