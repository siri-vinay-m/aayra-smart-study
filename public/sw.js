/**
 * Service Worker for Push Notifications
 * Handles background push notifications and notification clicks
 */

// Install event - cache resources if needed
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches if needed
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', function(event) {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'Aayra Study Reminder',
    body: 'Time for your study session!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'study-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Start Studying',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/favicon.ico'
      }
    ]
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: {
        url: '/',
        timestamp: Date.now()
      }
    })
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open the app when notification is clicked
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function(clientList) {
      // If app is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === self.location.origin + '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If app is not open, open it
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Background sync for offline notification scheduling
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync-notifications') {
    console.log('Background sync triggered for notifications');
    // Handle background notification scheduling here if needed
  }
});

// Message event - handle messages from main thread
self.addEventListener('message', function(event) {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});