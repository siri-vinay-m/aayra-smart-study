/**
 * Service Worker Registration Utility
 * Handles registration and management of service worker for push notifications
 */

export interface ServiceWorkerRegistrationResult {
  success: boolean;
  registration?: ServiceWorkerRegistration;
  error?: string;
}

/**
 * Register the service worker for push notifications
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistrationResult> => {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers are not supported in this browser');
    return {
      success: false,
      error: 'Service workers not supported'
    };
  }

  try {
    console.log('Registering service worker...');
    
    // Register the service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('Service worker registered successfully:', registration);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('Service worker is ready');

    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Received message from service worker:', event.data);
      
      // Handle different message types
      if (event.data?.type === 'NOTIFICATION_CLICKED') {
        // Handle notification click
        console.log('Notification clicked:', event.data.payload);
        
        // Focus the app window if it's running
        if (window) {
          window.focus();
        }
      }
    });

    return {
      success: true,
      registration
    };
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Check if service worker is registered and active
 */
export const isServiceWorkerActive = (): boolean => {
  return !!(
    'serviceWorker' in navigator &&
    navigator.serviceWorker.controller
  );
};

/**
 * Get the active service worker registration
 */
export const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    return registration || null;
  } catch (error) {
    console.error('Error getting service worker registration:', error);
    return null;
  }
};

/**
 * Unregister all service workers (for cleanup)
 */
export const unregisterServiceWorkers = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      await registration.unregister();
      console.log('Service worker unregistered:', registration);
    }
    
    return true;
  } catch (error) {
    console.error('Error unregistering service workers:', error);
    return false;
  }
};