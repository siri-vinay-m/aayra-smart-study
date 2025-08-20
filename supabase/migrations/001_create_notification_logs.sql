-- Create notification_logs table for tracking smart push notifications
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

-- Add comments for documentation
COMMENT ON TABLE notification_logs IS 'Tracks smart push notifications sent to users';
COMMENT ON COLUMN notification_logs.user_id IS 'Reference to the user who received the notification';
COMMENT ON COLUMN notification_logs.notification_type IS 'Type of notification: pending_review, smart_recap, motivational, ai_tip';
COMMENT ON COLUMN notification_logs.content IS 'The actual notification message content';
COMMENT ON COLUMN notification_logs.scheduled_time IS 'When the notification was scheduled to be sent';
COMMENT ON COLUMN notification_logs.sent_time IS 'When the notification was actually sent';
COMMENT ON COLUMN notification_logs.delivered_time IS 'When the notification was delivered to the device';
COMMENT ON COLUMN notification_logs.clicked_time IS 'When the user clicked/interacted with the notification';
COMMENT ON COLUMN notification_logs.status IS 'Current status: scheduled, sent, delivered, clicked, failed';