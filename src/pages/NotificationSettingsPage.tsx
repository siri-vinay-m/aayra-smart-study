/**
 * Notification Settings Page
 * Allows users to manage their smart notification preferences and view analytics
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import NotificationAnalytics from '@/components/notifications/NotificationAnalytics';
import NotificationTestMobile from '@/components/NotificationTestMobile';
import { notificationService } from '@/services/notificationService';
import { mobileNotificationService } from '@/services/mobileNotificationService';
import { Capacitor } from '@capacitor/core';

const NotificationSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [platform, setPlatform] = useState<string>('web');

  useEffect(() => {
    // Detect platform and check notification permissions
    const initializeNotifications = async () => {
      const isNativePlatform = Capacitor.isNativePlatform();
      const platformName = Capacitor.getPlatform();
      
      setIsMobile(isNativePlatform);
      setPlatform(platformName);
      
      if (isNativePlatform) {
        // Mobile platform - use Capacitor push notifications
        try {
          await mobileNotificationService.initialize();
          const permissions = await mobileNotificationService.checkPermissions();
          setNotificationsEnabled(permissions.display === 'granted');
        } catch (error) {
          console.error('Error initializing mobile notifications:', error);
          setNotificationsEnabled(false);
        }
      } else {
        // Web platform - use browser notifications
        if ('Notification' in window) {
          setNotificationsEnabled(Notification.permission === 'granted');
        }
      }
    };
    
    initializeNotifications();
  }, []);

  const handleNotificationToggle = async (enabled: boolean) => {
    setIsLoading(true);
    
    try {
      if (enabled) {
        let granted = false;
        
        if (isMobile) {
          // Mobile platform - use Capacitor push notifications
          granted = await mobileNotificationService.requestPermissions();
        } else {
          // Web platform - use browser notifications
          granted = await notificationService.requestPermission();
        }
        
        if (granted) {
          setNotificationsEnabled(true);
          toast({
            title: "Notifications Enabled",
            description: isMobile 
              ? "You'll now receive push notifications on your mobile device."
              : "You'll now receive browser notifications.",
          });
        } else {
          setNotificationsEnabled(false);
          toast({
            title: "Permission Denied",
            description: isMobile
              ? "Please enable push notifications in your device settings to receive study reminders."
              : "Please enable notifications in your browser settings to receive study reminders.",
            variant: "destructive",
          });
        }
      } else {
        // Cannot programmatically disable notifications, but we can update the UI
        setNotificationsEnabled(false);
        toast({
          title: "Notifications Disabled",
          description: isMobile
            ? "To fully disable notifications, please update your device settings."
            : "To fully disable notifications, please update your browser settings.",
        });
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="px-4 max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Notification Settings</h1>
        </div>

        {/* Platform Info */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isMobile ? (
                  <Smartphone className="h-5 w-5 text-blue-600" />
                ) : (
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="font-medium">
                  {isMobile ? 'Mobile Device' : 'Web Browser'}
                </span>
              </div>
              <Badge variant={isMobile ? 'default' : 'secondary'}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {isMobile 
                ? 'Native push notifications will be sent to your mobile device'
                : 'Browser notifications will be shown while the app is open'
              }
            </p>
          </CardContent>
        </Card>

        {/* Notification Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {notificationsEnabled ? (
                <Bell className="h-5 w-5 text-green-600" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              {isMobile ? 'Push Notifications' : 'Browser Notifications'}
            </CardTitle>
            <CardDescription>
              {isMobile 
                ? 'Enable native push notifications for study reminders and alerts'
                : 'Enable browser notifications for study reminders and alerts'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifications-toggle" className="text-sm font-medium">
                  Enable Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive personalized study reminders and motivational messages
                </p>
              </div>
              <Switch
                id="notifications-toggle"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
                disabled={isLoading}
              />
            </div>
            
            {!notificationsEnabled && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Notifications are currently disabled.</strong> Enable them to receive:
                </p>
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                  <li>Study session reminders</li>
                  <li>Personalized motivational messages</li>
                  <li>Smart recap notifications</li>
                  <li>AI-powered study tips</li>
                </ul>
              </div>
            )}
            
            {notificationsEnabled && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Notifications are enabled!</strong> You'll receive personalized study reminders and smart notifications to help you stay on track.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mobile Notification Test Component */}
        {isMobile && (
          <NotificationTestMobile className="mb-6" />
        )}

        {/* Notification Analytics Component */}
        <NotificationAnalytics />
      </div>
    </MainLayout>
  );
};

export default NotificationSettingsPage;