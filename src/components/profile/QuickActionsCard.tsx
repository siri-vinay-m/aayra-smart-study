import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActionsCard: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: BookOpen,
      label: 'Study Now',
      action: () => navigate('/study'),
      color: 'text-blue-600'
    },
    {
      icon: Calendar,
      label: 'Schedule',
      action: () => navigate('/schedule'),
      color: 'text-green-600'
    },
    {
      icon: Target,
      label: 'Goals',
      action: () => navigate('/goals'),
      color: 'text-purple-600'
    },
    {
      icon: TrendingUp,
      label: 'Progress',
      action: () => navigate('/progress'),
      color: 'text-orange-600'
    }
  ];

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={action.action}
              >
                <IconComponent className={`h-6 w-6 ${action.color}`} />
                <span className="text-sm">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;