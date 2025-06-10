
import React, { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CircularTimer from '@/components/timer/CircularTimer';
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
      <div className="px-4 flex flex-col items-center">
        {currentSession ? (
          <h1 className="text-xl font-semibold mb-8 text-center">{currentSession.sessionName}</h1>
        ) : (
          <h1 className="text-xl font-semibold mb-8 text-center">Focus Timer</h1>
        )}
        
        <CircularTimer />
        
        <div className="mt-8 text-center text-gray-600">
          {currentSession ? (
            <>
              <p>Focus on your study materials.</p>
              <p className="mt-2">You'll be prompted to upload your notes when the timer ends.</p>
            </>
          ) : (
            <>
              <p>Start a focus session to begin studying.</p>
              <p className="mt-2">Create a new session first to track your progress.</p>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default FocusTimerPage;
