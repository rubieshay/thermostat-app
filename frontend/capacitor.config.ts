import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.shaytech.gthermostat',
  appName: 'GoogleThermostat',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  },
  android: {
    // allowMixedContent: true,
    buildOptions: {
      keystorePath: 'upload-keystore.jks',
      keystoreAlias: 'upload',
      // Don't put passwords here - use environment variables
    }
  }
};

export default config;
