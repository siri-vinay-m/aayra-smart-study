
import React, { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import EnhancedFocusTimer from '@/components/timer/EnhancedFocusTimer';
import { useSession } from '@/contexts/SessionContext';
import { useTimer } from '@/contexts/TimerContext';

const FocusTimerPage = () => {
  const { currentSession } = useSession();
  const { setTimerType, startTimer, status, timerType } = useTimer();

  useEffect(() => {
    setTimerType('focus');
  }, [setTimerType]);

  // Timer should not auto-start - user must click Start button
  
  return (
    <MainLayout>
      <div className="w-full max-w-md mx-auto px-4 flex flex-col items-center overflow-x-hidden">
        {currentSession ? (
          <h1 className="text-xl font-semibold mb-8 text-center break-words">{currentSession.sessionName}</h1>
        ) : (
          <h1 className="text-xl font-semibold mb-8 text-center">Focus Timer</h1>
        )}
        
        <EnhancedFocusTimer />
      </div>
    </MainLayout>
  );
};

export default FocusTimerPage;
