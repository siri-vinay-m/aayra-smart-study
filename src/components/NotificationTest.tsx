import React, { useState } from 'react';
import { notificationService } from '../services/notificationService';

const NotificationTest: React.FC = () => {
  const [permissionStatus, setPermissionStatus] = useState<string>(Notification.permission);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await notificationService.requestPermission();
      setPermissionStatus(Notification.permission);
      if (granted) {
        console.log('Permission granted and test notification sent!');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = () => {
    if (Notification.permission === 'granted') {
      notificationService.showTestNotification();
    } else {
      alert('Please grant notification permission first!');
    }
  };

  const handleStudyReminder = () => {
    if (Notification.permission === 'granted') {
      notificationService.showNotification(
        '📚 Study Time!',
        'Time for your scheduled study session. Let\'s boost your productivity!',
        '/favicon.png',
        true
      );
    } else {
      alert('Please grant notification permission first!');
    }
  };

  const getPermissionStatusColor = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'text-green-600';
      case 'denied':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getPermissionStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return '✅ Granted';
      case 'denied':
        return '❌ Denied';
      default:
        return '⏳ Default (Not requested)';
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
        🔔 Notification Test Center
      </h2>
      
      <div className="space-y-4">
        {/* Permission Status */}
        <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-semibold text-foreground mb-2">Permission Status:</h3>
          <p className={`font-medium ${getPermissionStatusColor()}`}>
            {getPermissionStatusText()}
          </p>
        </div>

        {/* Service Worker Status */}
        <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-semibold text-foreground mb-2">Service Worker:</h3>
          <p className={`font-medium ${
            'serviceWorker' in navigator ? 'text-green-600' : 'text-red-600'
          }`}>
            {'serviceWorker' in navigator ? '✅ Supported' : '❌ Not Supported'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRequestPermission}
            disabled={isLoading || permissionStatus === 'granted'}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-muted disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '⏳ Requesting...' : '🔔 Request Permission'}
          </button>

          <button
            onClick={handleTestNotification}
            disabled={permissionStatus !== 'granted'}
            className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-muted disabled:cursor-not-allowed transition-colors"
          >
            🧪 Send Test Notification
          </button>

          <button
            onClick={handleStudyReminder}
            disabled={permissionStatus !== 'granted'}
            className="w-full py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-muted disabled:cursor-not-allowed transition-colors"
          >
            📚 Send Study Reminder
          </button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">📋 Testing Instructions:</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Click "Request Permission" to enable notifications</li>
            <li>2. Allow notifications when prompted by your browser</li>
            <li>3. Test with "Send Test Notification"</li>
            <li>4. Try "Send Study Reminder" to see study notifications</li>
          </ol>
        </div>

        {/* Browser Info */}
        <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-semibold text-foreground mb-2">🌐 Browser Info:</h3>
        <div className="text-sm text-muted-foreground space-y-1">
            <p>Notifications API: {'Notification' in window ? '✅' : '❌'}</p>
            <p>Service Worker: {'serviceWorker' in navigator ? '✅' : '❌'}</p>
            <p>Push Manager: {'PushManager' in window ? '✅' : '❌'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationTest;