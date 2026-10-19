import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
// unused imports removed
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { WalletWiseIntro } from '../components/WalletWiseIntro';

// Keep the native splash screen visible until our React hierarchy mounts
SplashScreen.preventAutoHideAsync().catch(() => {});

class IntroErrorBoundary extends React.Component<{ onFinish: () => void; children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn('Intro video error caught by boundary:', error);
    SplashScreen.hideAsync().catch(() => {});
    this.props.onFinish();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function RootLayout() {
  const [isIntroFinished, setIsIntroFinished] = useState(false);

  useEffect(() => {
    // Failsafe: hide splash screen within 1.5s regardless of video status
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleIntroFinish = () => {
    SplashScreen.hideAsync().catch(() => {});
    setIsIntroFinished(true);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="card-detail" options={{ headerShown: false, gestureEnabled: true, gestureDirection: 'horizontal' }} />
        <Stack.Screen name="create-card" options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="add-card" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="find-card" options={{ headerShown: false }} />
        <Stack.Screen name="trip-planner" options={{ headerShown: false }} />
      </Stack>
      {!isIntroFinished && (
        <IntroErrorBoundary onFinish={handleIntroFinish}>
          <WalletWiseIntro onFinish={handleIntroFinish} />
        </IntroErrorBoundary>
      )}
    </GestureHandlerRootView>
  );
}

