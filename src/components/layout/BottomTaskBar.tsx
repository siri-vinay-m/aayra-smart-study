
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, Plus, AlertCircle, List } from 'lucide-react';

interface BottomTaskBarProps {
  onNavigationAttempt?: (destination: string) => void;
}

const BottomTaskBar: React.FC<BottomTaskBarProps> = ({ onNavigationAttempt }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (destination: string) => {
    if (onNavigationAttempt) {
      onNavigationAttempt(destination);
    } else {
      navigate(destination);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    {
      path: '/pending-reviews',
      icon: Clock,
      label: 'Reviews',
    },
    {
      path: '/new-session',
      icon: Plus,
      label: 'New',
    },
    {
      path: '/incomplete-sessions',
      icon: AlertCircle,
      label: 'Incomplete',
    },
    {
      path: '/completed-sessions',
      icon: List,
      label: 'Completed',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center gap-1 h-auto py-2 ${
                isActive(item.path) ? 'text-orange-500' : 'text-gray-600'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomTaskBar;
