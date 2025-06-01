
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

  const getButtonText = () => {
    if (notificationPermission === 'denied') {
      return 'Notifications Blocked - Check Browser Settings';
    }
    return 'Enable Study Reminders';
  };

  const getDescriptionText = () => {
    if (notificationPermission === 'denied') {
      return 'Notifications are currently blocked. Please enable them in your browser settings to receive study reminders.';
    }
    return 'Enable notifications to receive study reminders 15 minutes before your preferred study time.';
  };

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
          {getDescriptionText()}
        </p>
        <Button 
          onClick={onEnableNotifications}
          className="w-full"
          variant={notificationPermission === 'denied' ? 'secondary' : 'outline'}
          disabled={notificationPermission === 'denied'}
        >
          <Bell size={16} className="mr-2" />
          {getButtonText()}
        </Button>
        {notificationPermission === 'denied' && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Go to your browser settings → Notifications → Allow this site to send notifications
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCard;
