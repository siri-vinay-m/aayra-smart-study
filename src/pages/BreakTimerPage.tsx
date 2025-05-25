
import React, { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CircularTimer from '@/components/timer/CircularTimer';
import { useSession } from '@/contexts/SessionContext';
import { useTimer } from '@/contexts/TimerContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const BreakTimerPage = () => {
  const { currentSession } = useSession();
  const { setTimerType, startTimer, status, timeLeft, skipTimer } = useTimer(); // Added skipTimer
  const navigate = useNavigate();
  
  useEffect(() => {
    setTimerType('break');
    // Auto-start the break timer
    setTimeout(() => {
      if (status === 'idle') { // Only start if it's idle, to prevent multiple starts
        startTimer();
      }
    }, 100);
  }, [setTimerType, startTimer, status]); // Added status to dependency array

  // Navigate to home when break timer completes (This might be superseded by logic in TimerContext if skipTimer also navigates)
  // For now, let's keep it, but be mindful of potential double navigation or conflicting logic.
  // The TimerContext's useEffect for timeLeft === 0 already handles navigation for completed timers.
  // This specific effect might be redundant if skipTimer also sets status to 'completed'.
  useEffect(() => {
    if (status === 'completed' && timeLeft === 0 && timerType === 'break') { // Added timerType check for safety
      // navigate('/home'); // This navigation is now handled by TimerContext
    }
  }, [status, timeLeft, navigate, timerType]); // Added timerType
  
  const handleSkip = () => {
    skipTimer(); // Use skipTimer from TimerContext
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
  
  return (
    <MainLayout>
      <div className="px-4 flex flex-col items-center">
        <h1 className="text-xl font-semibold mb-8 text-center">Break Time</h1>
        
        <CircularTimer showControls={false} />
        
        <div className="mt-8 text-center text-gray-600">
          <p>Take a short break to rest your mind.</p>
          <p className="mt-2">You'll return to the home screen when the timer ends.</p>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="px-6 py-3"
          >
            Skip
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default BreakTimerPage;
