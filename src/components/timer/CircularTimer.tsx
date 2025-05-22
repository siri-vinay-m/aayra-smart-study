
import React from 'react';
import { useTimer } from '@/contexts/TimerContext';

interface CircularTimerProps {
  showControls?: boolean;
}

const CircularTimer: React.FC<CircularTimerProps> = ({ showControls = true }) => {
  const { 
    timerType, 
    timeLeft, 
    status, 
    startTimer, 
    pauseTimer, 
    resetTimer, 
    skipTimer,
    progress 
  } = useTimer();

  // Convert seconds to minutes and seconds
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Calculate circle circumference and stroke-dashoffset
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="circular-timer">
        <svg width="100%" height="100%" viewBox="0 0 220 220" className="rotate-[-90deg]">
          {/* Background circle */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="#E0E0E0"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="#FF6600"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-semibold">{formattedTime}</div>
          <div className="text-sm text-gray-500 mt-2 capitalize">
            {timerType} {status === 'running' ? 'in progress' : status}
          </div>
        </div>
      </div>

      {showControls && (
        <div className="flex items-center justify-center gap-6 mt-8">
          <button
            onClick={resetTimer}
            className="px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-colors"
          >
            Reset
          </button>

          {status === 'running' ? (
            <button
              onClick={pauseTimer}
              className="px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium transition-colors"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={startTimer}
              className="px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium transition-colors"
            >
              {status === 'paused' ? 'Resume' : 'Start'}
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm(`Do you want to skip to ${timerType === 'focus' ? 'validation' : 'home'}?`)) {
                skipTimer();
              }
            }}
            className="px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-colors"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
};

export default CircularTimer;
