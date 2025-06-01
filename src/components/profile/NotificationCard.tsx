
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

interface NotificationCardProps {
  notificationPermission: NotificationPermission;
  onEnableNotifications: () => Promise<void>;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notificationPermission,
  onEnableNotifications
}) => {
  if (notificationPermission === 'granted') {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell size={20} className="text-blue-500" />
          Study Reminders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3">
          Enable notifications to receive study reminders 15 minutes before your preferred study time.
        </p>
        <Button 
          onClick={onEnableNotifications}
          className="w-full"
          variant="outline"
        >
          <Bell size={16} className="mr-2" />
          Enable Study Reminders
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationCard;
