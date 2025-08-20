import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { simpleMobileNotificationService } from '@/services/mobileNotificationService';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { Bell, Smartphone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface NotificationTestMobileProps {
  className?: string;
}

const NotificationTestMobile: React.FC<NotificationTestMobileProps> = ({ className }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isMobile, setIsMobile] = useState(false);
  const [platform, setPlatform] = useState<string>('web');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const initializeNotifications = async () => {
      // Check if we're on a mobile platform
      const mobile = Capacitor.isNativePlatform();
      setIsMobile(mobile);
      setPlatform(Capacitor.getPlatform());

      // Get current user
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
      } catch (error) {
        console.error('Error getting user:', error);
      }

      try {
        // Initialize the simplified notification service
        await simpleMobileNotificationService.initialize();
        
        // Check current permissions
        const permissions = await simpleMobileNotificationService.checkPermissions();
        setPermissionStatus(permissions.display);
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  const handleRequestPermission = async () => {
    if (!isMobile) {
      toast({
        title: "Not Available",
        description: "Mobile notifications are only available on mobile devices.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const granted = await simpleMobileNotificationService.requestPermissions();
      setPermissionStatus(granted ? 'granted' : 'denied');
      
      if (granted) {
        toast({
          title: "Permission Granted",
          description: "Push notifications are now enabled!",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Push notifications were not enabled. Please check your device settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLocalNotification = async () => {
    if (!isMobile) {
      toast({
        title: "Not Available",
        description: "Local notifications are only available on mobile devices.",
        variant: "destructive"
      });
      return;
    }

    if (permissionStatus !== 'granted') {
      toast({
        title: "Permission Required",
        description: "Please grant notification permission first.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await simpleMobileNotificationService.scheduleLocalNotification(
        "Test Local Notification",
        "This is a test local notification from Aayra Smart Study!",
        3000 // 3 seconds delay
      );
      toast({
        title: "Test Scheduled",
        description: "A test notification will appear in 3 seconds.",
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
      toast({
        title: "Error",
        description: "Failed to schedule test notification.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestRealtimeNotification = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "No authenticated user found",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await simpleMobileNotificationService.sendNotificationToUser(
        userId,
        'Test Realtime Notification',
        'This notification came through Supabase realtime!',
        'test'
      );
      
      if (success) {
        toast({
          title: "Success",
          description: "Realtime notification sent! It should appear shortly.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send notification. Check console for details.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Error sending notification: ${error}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionIcon = () => {
    switch (permissionStatus) {
      case 'granted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'denied':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPermissionBadge = () => {
    switch (permissionStatus) {
      case 'granted':
        return <Badge variant="default" className="bg-green-100 text-green-800">Granted</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="secondary">Not Requested</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Test (Simplified)
        </CardTitle>
        <CardDescription>
          Test local and realtime notifications using Supabase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform Info */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span className="text-sm font-medium">Platform:</span>
          </div>
          <Badge variant={isMobile ? "default" : "secondary"}>
            {platform} {isMobile ? "(Mobile)" : "(Web)"}
          </Badge>
        </div>

        {/* Permission Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {getPermissionIcon()}
            <span className="text-sm font-medium">Permission Status:</span>
          </div>
          {getPermissionBadge()}
        </div>

        {/* User Info */}
        {userId && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2">User ID:</div>
            <div className="text-xs font-mono bg-background p-2 rounded border break-all">
              {userId}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            onClick={handleRequestPermission}
            disabled={isLoading || !isMobile || permissionStatus === 'granted'}
            className="w-full"
          >
            {isLoading ? "Requesting..." : "Request Notification Permission"}
          </Button>

          <Button 
            onClick={handleTestLocalNotification}
            disabled={isLoading || !isMobile || permissionStatus !== 'granted'}
            variant="outline"
            className="w-full"
          >
            {isLoading ? "Scheduling..." : "Test Local Notification"}
          </Button>

          <Button 
            onClick={sendTestRealtimeNotification}
            disabled={isLoading || !userId || permissionStatus !== 'granted'}
            variant="outline"
            className="w-full"
          >
            {isLoading ? "Sending..." : "Test Realtime Notification"}
          </Button>
        </div>

        {/* Instructions */}
        {!isMobile && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-800">
              <strong>Note:</strong> Mobile notifications work best on mobile devices. 
              Web notifications are also supported in browsers.
            </div>
          </div>
        )}

        {!userId && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Login Required:</strong> Please log in to test realtime notifications.
            </div>
          </div>
        )}

        {permissionStatus === 'denied' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-800">
              <strong>Permission Denied:</strong> Please enable notifications in your device settings 
              to receive notifications.
            </div>
          </div>
        )}

        {permissionStatus === 'granted' && userId && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-800">
              <strong>Ready:</strong> Notifications are enabled! You'll receive study reminders 
              and realtime notifications through Supabase.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationTestMobile;