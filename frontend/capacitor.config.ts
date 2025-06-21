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
    },
    SplashScreen: {
      launchShowDuration: 0, // Hide splash screen immediately after app load
      launchAutoHide: false, // Automatically hide splash screen after launch
    },
    SafeArea: {
      enabled: true,
      customColorsForSystemBars: true,
      statusBarColor: '#000000',
      statusBarContent: 'light',
      navigationBarColor: '#000000',
      navigationBarContent: 'light',
      offset: 0,
    },
  },
  android: {
    // allowMixedContent: true,
    buildOptions: {
      keystorePath: 'upload-keystore.jks',
      keystoreAlias: 'upload',
      // Don't put passwords here - use environment variables
    },
//    adjustMarginsForEdgeToEdge: "auto"
  }
};

export default config;
