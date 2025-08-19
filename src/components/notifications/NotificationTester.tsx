import React, { useEffect, useState } from 'react';
import { enhancedNotificationService } from '@/services/enhancedNotificationService';
import { notificationService } from '@/services/notificationService';

interface TestResult {
  timestamp: string;
  type: string;
  success: boolean;
  message: string;
  details?: any;
}

/**
 * NotificationTester component provides a UI to validate local notifications,
 * service worker registration, permission flow, and smart notification triggers.
 */
const NotificationTester: React.FC = () => {
  const [status, setStatus] = useState<any>({});
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      const systemStatus = await enhancedNotificationService.getSystemStatus();
      setStatus(systemStatus);
    };
    init();
  }, []);

  /**
   * Append a test result entry to the list with a timestamp.
   */
  const addResult = (result: { type: string; success: boolean; message: string; details?: any }) => {
    const entry: TestResult = {
      timestamp: new Date().toLocaleString(),
      ...result,
    };
    setResults(prev => [entry, ...prev].slice(0, 20));
  };

  /**
   * Initialize the enhanced notification service (register SW, init smart service, request permission).
   */
  const handleInit = async () => {
    setLoading(true);
    try {
      await enhancedNotificationService.initialize();
      addResult({ type: 'init', success: true, message: 'Enhanced notification service initialized' });
      const systemStatus = await enhancedNotificationService.getSystemStatus();
      setStatus(systemStatus);
    } catch (error) {
      addResult({ type: 'init', success: false, message: 'Initialization failed', details: error });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Request browser notification permissions.
   */
  const handlePermission = async () => {
    setLoading(true);
    try {
      const granted = await notificationService.requestPermission();
      addResult({ type: 'permission', success: granted, message: granted ? 'Permission granted' : 'Permission denied' });
      const systemStatus = await enhancedNotificationService.getSystemStatus();
      setStatus(systemStatus);
    } catch (error) {
      addResult({ type: 'permission', success: false, message: 'Permission request failed', details: error });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send an immediate local notification to verify the UI step "Test Local Notification".
   */
  const handleTestNotification = async () => {
    setLoading(true);
    try {
      const result = await enhancedNotificationService.sendTestNotification();
      addResult({ type: 'test-notification', success: result.success, message: result.message, details: result.details });
    } catch (error) {
      addResult({ type: 'test-notification', success: false, message: 'Test notification failed', details: error });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate and send a smart notification using the provided user ID.
   */
  const handleSmartTest = async () => {
    if (!userId) {
      addResult({ type: 'smart-test', success: false, message: 'Please enter a user ID' });
      return;
    }

    setLoading(true);
    try {
      const result = await enhancedNotificationService.sendSmartTestNotification(userId);
      addResult({ type: 'smart-test', success: result.success, message: result.message, details: result.details });
    } catch (error) {
      addResult({ type: 'smart-test', success: false, message: 'Smart test failed', details: error });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Schedule a notification (default 1 minute) for the given user ID.
   */
  const handleScheduleTest = async () => {
    if (!userId) {
      addResult({ type: 'schedule-test', success: false, message: 'Please enter a user ID' });
      return;
    }

    setLoading(true);
    try {
      const result = await enhancedNotificationService.scheduleTestNotification(userId, 1);
      addResult({ type: 'schedule-test', success: result.success, message: result.message, details: result.details });
    } catch (error) {
      addResult({ type: 'schedule-test', success: false, message: 'Schedule test failed', details: error });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manually trigger the daily service run of the smart notification system.
   */
  const handleDailyService = async () => {
    setLoading(true);
    try {
      const result = await enhancedNotificationService.triggerDailyServiceTest();
      addResult({ type: 'daily-service', success: result.success, message: result.message, details: result.details });
    } catch (error) {
      addResult({ type: 'daily-service', success: false, message: 'Daily service trigger failed', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Notification Tester</h2>

      <div style={{ marginBottom: 16, padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
        <h3>System Status</h3>
        <pre style={{ overflow: 'auto' }}>{JSON.stringify(status, null, 2)}</pre>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button disabled={loading} onClick={handleInit}>Initialize</button>
        <button disabled={loading} onClick={handlePermission}>Request Permission</button>
        <button disabled={loading} onClick={handleTestNotification}>Test Local Notification</button>
        <button disabled={loading} onClick={handleDailyService}>Trigger Daily Service</button>
      </div>

      <div style={{ marginBottom: 16, padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
        <h3>Smart Tests</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Enter user ID" 
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <button disabled={loading} onClick={handleSmartTest}>Send Smart Test</button>
          <button disabled={loading} onClick={handleScheduleTest}>Schedule Test (1 min)</button>
        </div>
      </div>

      <div>
        <h3>Recent Results</h3>
        {results.length === 0 ? (
          <p>No test results yet. Run a test above.</p>
        ) : (
          <ul>
            {results.map((r, i) => (
              <li key={i}>
                <strong>{r.timestamp}</strong> [{r.type}] - {r.success ? '✅' : '❌'} {r.message}
                {r.details && <pre style={{ overflow: 'auto' }}>{JSON.stringify(r.details, null, 2)}</pre>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationTester;