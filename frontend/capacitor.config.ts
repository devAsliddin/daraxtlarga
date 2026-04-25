import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uz.yashilquest.app',
  appName: 'Yashil Quest',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    backgroundColor: '#030712',
    allowMixedContent: true,
  },
};

export default config;
