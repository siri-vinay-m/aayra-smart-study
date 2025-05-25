
import React, { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CircularTimer from '@/components/timer/CircularTimer';
import { useTimer } from '@/contexts/TimerContext';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const BreakTimerPage = () => {
  const { setTimerType, startTimer, skipTimer } = useTimer();
  const { currentSession } = useSession();

  useEffect(() => {
    // Set timer type to break and auto-start when component mounts
    setTimerType('break');
    
    // Auto-start the break timer with a small delay
    const timer = setTimeout(() => {
      startTimer();
    }, 100);

    return () => clearTimeout(timer);
  }, [setTimerType, startTimer]);

  if (!currentSession) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-lg text-gray-600">No active session found</p>
        </div>
      </MainLayout>
    );
  }

  const getInitialTime = () => {
    if (currentSession) {
      return currentSession.breakDurationMinutes * 60;
    }
    return 5 * 60; // Default 5 minutes
  };

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h1 className="text-2xl font-semibold text-center mb-6">Break Time</h1>
            
            <div className="flex justify-center mb-6">
              <CircularTimer showControls={false} />
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={skipTimer}
                variant="outline" 
                className="w-full"
              >
                Skip Break
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default BreakTimerPage;
