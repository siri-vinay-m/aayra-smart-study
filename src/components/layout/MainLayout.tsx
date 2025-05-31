
import React from 'react';
import TopProfileBar from './TopProfileBar';
import BottomTaskBar from './BottomTaskBar';

interface MainLayoutProps {
  children: React.ReactNode;
  onNavigationAttempt?: (destination: string) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, onNavigationAttempt }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopProfileBar onNavigationAttempt={onNavigationAttempt} />
      <main className="flex-1 pb-20">
        {children}
      </main>
      <BottomTaskBar onNavigationAttempt={onNavigationAttempt} />
    </div>
  );
};

export default MainLayout;
