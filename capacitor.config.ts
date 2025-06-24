import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aayra.smartstudy',
  appName: 'Aayra',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff',
      overlaysWebView: false
    }
  }
};

export default config;
