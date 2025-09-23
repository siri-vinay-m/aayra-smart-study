/**
 * Notification Analytics Component
 * Displays notification logs and analytics for debugging and monitoring
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/contexts/UserContext';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Bell, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface NotificationLog {
  id: string;
  notification_type: string;
  content: string;
  scheduled_time: string;
  sent_time?: string;
  delivered_time?: string;
  clicked_time?: string;
  status: string;
  created_at: string;
}

interface NotificationStats {
  total: number;
  sent: number;
  delivered: number;
  clicked: number;
  failed: number;
  clickRate: number;
  deliveryRate: number;
}

export const NotificationAnalytics: React.FC = () => {
  const { user } = useUser();
  const { triggerDailyService, isSmartNotificationsEnabled } = useSmartNotifications();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    sent: 0,
    delivered: 0,
    clicked: 0,
    failed: 0,
    clickRate: 0,
    deliveryRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadNotificationLogs();
    }
  }, [user?.id]);

  const loadNotificationLogs = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Since notification_logs table doesn't exist, show placeholder data
      const logs: NotificationLog[] = [];
      setLogs(logs);
      
      // Set default statistics
      setStats({
        total: 0,
        sent: 0,
        delivered: 0,
        clicked: 0,
        failed: 0,
        clickRate: 0,
        deliveryRate: 0
      });
    } catch (error) {
      console.error('Error in loadNotificationLogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerDailyService = async () => {
    setTriggering(true);
    try {
      await triggerDailyService();
      // Reload logs after triggering
      setTimeout(() => {
        loadNotificationLogs();
      }, 2000);
    } catch (error) {
      console.error('Error triggering daily service:', error);
    } finally {
      setTriggering(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'clicked':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'default';
      case 'clicked':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'scheduled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'pending_review':
        return 'bg-blue-100 text-blue-800';
      case 'smart_recap':
        return 'bg-green-100 text-green-800';
      case 'motivational':
        return 'bg-purple-100 text-purple-800';
      case 'ai_tip':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-muted text-foreground';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Smart Notifications</h2>
          <p className="text-muted-foreground">
            Analytics and logs for your personalized study notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isSmartNotificationsEnabled() ? 'default' : 'secondary'}>
            {isSmartNotificationsEnabled() ? 'Enabled' : 'Disabled'}
          </Badge>
          <Button 
            onClick={handleTriggerDailyService} 
            disabled={triggering}
            size="sm"
          >
            {triggering ? 'Triggering...' : 'Test Daily Service'}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deliveryRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.delivered} of {stats.sent} sent
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clickRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.clicked} of {stats.sent} sent
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>
            Your last 50 smart notifications with delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications found</p>
              <p className="text-sm">Smart notifications will appear here once they're sent</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <Badge variant={getStatusBadgeVariant(log.status)}>
                        {log.status}
                      </Badge>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNotificationTypeColor(log.notification_type)}`}>
                        {log.notification_type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(log.scheduled_time)}
                    </span>
                  </div>
                  
                  <p className="text-sm">{log.content}</p>
                  
                  {(log.sent_time || log.delivered_time || log.clicked_time) && (
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {log.sent_time && (
                        <span>Sent: {formatDateTime(log.sent_time)}</span>
                      )}
                      {log.delivered_time && (
                        <span>Delivered: {formatDateTime(log.delivered_time)}</span>
                      )}
                      {log.clicked_time && (
                        <span>Clicked: {formatDateTime(log.clicked_time)}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationAnalytics;