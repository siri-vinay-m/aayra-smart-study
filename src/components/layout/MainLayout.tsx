
import React, { ReactNode } from 'react';
import TopProfileBar from './TopProfileBar';
import BottomTaskBar from './BottomTaskBar';

interface MainLayoutProps {
  children: ReactNode;
  hideTopBar?: boolean;
  hideBottomBar?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  hideTopBar = false, 
  hideBottomBar = false 
}) => {
  return (
    <div className="aayra-container">
      {!hideTopBar && <TopProfileBar />}
      
      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </main>
      
      {!hideBottomBar && <BottomTaskBar />}
    </div>
  );
};

export default MainLayout;
