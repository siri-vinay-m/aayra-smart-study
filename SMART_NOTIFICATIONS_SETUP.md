# Smart Push Notification System Setup Guide

## Overview
This guide explains how to set up and test the Smart Push Notification System that sends personalized notifications 10 minutes before a user's preferred study time.

## Features Implemented

### 🔔 Smart Notification Service
- **File**: `src/services/smartNotificationService.ts`
- **Purpose**: Core service that runs daily to check user preferences and schedule notifications
- **Features**:
  - Fetches user preferences (study days/times)
  - Retrieves pending reviews and recent sessions
  - Generates personalized notification content
  - Schedules notifications 10 minutes before preferred study time
  - Logs all notification events to database

### 🎯 Notification Content Priority
1. **Pending Review Questions**: If user has pending reviews
2. **Smart Recap/Quiz**: From recently completed sessions
3. **Motivational Messages**: AI-generated study tips as fallback

### 📊 Analytics Dashboard
- **Component**: `src/components/notifications/NotificationAnalytics.tsx`
- **Page**: `src/pages/NotificationSettingsPage.tsx`
- **Route**: `/settings/notifications`
- **Features**:
  - View notification logs and delivery status
  - Track click rates and delivery rates
  - Manual trigger for testing
  - Real-time statistics

### 🔧 React Hook
- **File**: `src/hooks/useSmartNotifications.ts`
- **Purpose**: Easy integration for components to log notification events

## Database Setup

### 1. Create Notification Logs Table
Execute the following SQL in your Supabase dashboard:

```sql
-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_time TIMESTAMP WITH TIME ZONE,
  delivered_time TIMESTAMP WITH TIME ZONE,
  clicked_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_scheduled_time ON notification_logs(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_type ON notification_logs(notification_type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_notification_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_logs_updated_at
  BEFORE UPDATE ON notification_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_logs_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notification logs
CREATE POLICY "Users can view their own notification logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: System can insert notification logs (for service account)
CREATE POLICY "System can insert notification logs" ON notification_logs
  FOR INSERT WITH CHECK (true);

-- Policy: System can update notification logs (for service account)
CREATE POLICY "System can update notification logs" ON notification_logs
  FOR UPDATE USING (true);
```

### 2. Update TypeScript Types
Add the following to your `src/integrations/supabase/types.ts`:

```typescript
export interface NotificationLog {
  id: string;
  user_id: string;
  notification_type: string;
  content: string;
  scheduled_time: string;
  sent_time?: string;
  delivered_time?: string;
  clicked_time?: string;
  status: string;
  created_at: string;
  updated_at: string;
}
```

## Testing the System

### 1. Set User Preferences
1. Navigate to `/profile` in the app
2. Set your preferred study days and start time
3. Ensure notification permissions are granted

### 2. Test Notification Analytics
1. Navigate to `/settings/notifications`
2. Click "Test Daily Service" to manually trigger the service
3. View notification logs and statistics

### 3. Create Test Data
To test with pending reviews, create some study sessions and mark them for review.

## Production Deployment

### 1. Cron Job Setup
For production, set up a daily cron job to run the notification service:

```bash
# Run daily at 6 AM
0 6 * * * /path/to/your/notification-service-runner.js
```

### 2. Service Worker (Optional)
For better notification delivery, consider implementing a service worker:

```javascript
// public/sw.js
self.addEventListener('push', function(event) {
  const options = {
    body: event.data.text(),
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png'
  };
  
  event.waitUntil(
    self.registration.showNotification('Aayra Study Reminder', options)
  );
});
```

## Architecture Overview

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Daily Cron Job    │───▶│  Smart Notification  │───▶│   Browser/Device    │
│   (Production)      │    │      Service         │    │   Notifications     │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
                                       │
                                       ▼
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   User Preferences  │◀───│    Database Layer    │───▶│  Notification Logs  │
│   (Study Time/Days) │    │   (Supabase)         │    │   (Analytics)       │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
                                       ▲
                                       │
┌─────────────────────┐    ┌──────────────────────┐
│  Pending Reviews &  │───▶│   Content Generation │
│  Recent Sessions    │    │   (Smart Recap/Quiz) │
└─────────────────────┘    └──────────────────────┘
```

## Troubleshooting

### Common Issues

1. **Notifications not appearing**
   - Check browser notification permissions
   - Verify user has set preferred study days/times
   - Check browser console for errors

2. **Database connection errors**
   - Verify Supabase configuration
   - Check RLS policies are correctly set
   - Ensure notification_logs table exists

3. **Service not triggering**
   - Check if smartNotificationService is initialized in App.tsx
   - Verify user authentication status
   - Check browser console for initialization errors

### Debug Mode
Enable debug logging by adding to your environment:
```
VITE_DEBUG_NOTIFICATIONS=true
```

## Security Considerations

- All notification logs are protected by Row Level Security (RLS)
- Users can only view their own notification data
- Service account permissions needed for system operations
- No sensitive user data is stored in notification content

## Future Enhancements

1. **Push Notifications**: Implement web push for offline notifications
2. **A/B Testing**: Test different notification content strategies
3. **Machine Learning**: Optimize notification timing based on user engagement
4. **Multi-language**: Support for localized notification content
5. **Rich Notifications**: Include images and action buttons

---

**Note**: This system is designed to work with the existing Aayra Smart Study app architecture and integrates seamlessly with the current user profile and session management systems.