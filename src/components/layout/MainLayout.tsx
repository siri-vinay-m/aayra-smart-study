
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
      
      <div className="flex-1 py-4">
        {children}
      </div>
      
      {!hideBottomBar && <BottomTaskBar />}
    </div>
  );
};

export default MainLayout;
