
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.offline.ai.gallery',
  appName: 'Offline AI Gallery',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
