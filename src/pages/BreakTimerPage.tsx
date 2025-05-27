
import React, { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CircularTimer from '@/components/timer/CircularTimer';
import { useSession } from '@/contexts/SessionContext';
import { useTimer } from '@/contexts/TimerContext';

const BreakTimerPage = () => {
  const { currentSession } = useSession();
  const { setTimerType } = useTimer();

  useEffect(() => {
    setTimerType('break');
  }, [setTimerType]);
  
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
        <h1 className="text-xl font-semibold mb-8 text-center">{currentSession.sessionName}</h1>
        
        <CircularTimer />
        
        <div className="mt-8 text-center text-gray-600">
          <p>Take a well-deserved break!</p>
          <p className="mt-2">You'll be ready for your next session when the timer ends.</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default BreakTimerPage;
