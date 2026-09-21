import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'shop.lokaya.app',
  appName: 'LOKAYA',
  webDir: 'out',
  server: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://lokaya.shop',
    cleartext: true,
    allowNavigation: [
      'lokaya.shop',
      '*.lokaya.shop',
      'api.lokaya.shop',
      'localhost',
      '*.r2.cloudflarestorage.com'
    ]
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#059669',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    StatusBar: {
      backgroundColor: '#059669',
      style: 'DARK'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
