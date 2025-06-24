// App configuration for performance and user support
export const APP_CONFIG = {
  // Performance settings
  performance: {
    targetLoadTime: 500, // ms
    targetFPS: 60,
    enableLazyLoading: true,
    enableCaching: true,
    enablePrefetch: true,
  },
  
  // User support configuration
  support: {
    emails: [
      'support@aayra.com',
      'help@aayra.com'
    ],
    onboardingVideoUrl: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID',
  },
  
  // Navigation behavior
  navigation: {
    androidBackButton: true,
    iOSSwipeBack: true,
  },
  
  // Orientation support
  orientation: {
    portrait: true,
    landscape: true,
  }
};