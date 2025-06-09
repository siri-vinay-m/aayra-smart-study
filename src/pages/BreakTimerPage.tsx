
import React, { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CircularTimer from '@/components/timer/CircularTimer';
import { useSession } from '@/contexts/SessionContext';
import { useTimer } from '@/contexts/TimerContext';
import { useSessionDiscard } from '@/hooks/useSessionDiscard';
import DiscardSessionDialog from '@/components/dialogs/DiscardSessionDialog';

const BreakTimerPage = () => {
  const { currentSession } = useSession();
  const { setTimerType, startTimer, status, timerType } = useTimer();
  const {
    showDiscardDialog,
    isInBreakPhase,
    handleNavigationAttempt,
    handleDiscardSession,
    handleCancelDiscard,
  } = useSessionDiscard();

  useEffect(() => {
    setTimerType('break');
  }, [setTimerType]);

  // Auto-start break timer when coming from focus session
  useEffect(() => {
    if (currentSession && currentSession.status === 'break_in_progress' && status === 'idle' && timerType === 'break') {
      console.log('BreakTimerPage: Auto-starting break timer', { status, timerType, sessionStatus: currentSession.status });
      startTimer();
    }
  }, [currentSession, status, timerType]);
  
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
      
      <DiscardSessionDialog
        open={showDiscardDialog}
        onOpenChange={handleCancelDiscard}
        onConfirm={handleDiscardSession}
        isBreakPhase={isInBreakPhase}
      />
    </MainLayout>
  );
};

export default BreakTimerPage;
