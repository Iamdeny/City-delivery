import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'City Delivery',
  slug: 'city-delivery',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'citydelivery',
  extra: {
    webUrl: process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000',
    eas: {
      projectId:
        process.env.EAS_PROJECT_ID ?? '22d94876-5bef-44f4-902b-0ba810843352',
    },
  },
  ios: {
    bundleIdentifier: 'com.citydelivery.app',
    supportsTablet: true,
  },
  android: {
    package: 'com.citydelivery.app',
    usesCleartextTraffic: true,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
};

export default config;
