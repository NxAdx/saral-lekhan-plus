import React, { useEffect, useMemo, useState } from 'react';
import { AppState, useColorScheme, View, StyleSheet } from 'react-native';

import { Stack, useRootNavigationState } from 'expo-router';
import { ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';
import { LockScreen } from '../components/ui/LockScreen';
import { StaticSplash } from '../components/ui/StaticSplash';
import { ToastPill } from '../components/ui/ToastPill';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { themes } from '../tokens';
import { useFonts } from '@expo-google-fonts/hind';
import { useAiStore } from '../store/aiStore';
import { useNotesStore } from '../store/notesStore';
import { useRuntimeUxFlagsStore } from '../store/runtimeUxFlagsStore';
import { log } from '../utils/Logger';
import { shallow } from 'zustand/shallow';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();



export function RootLayout(props: any) {
  const { themeId, nightMode } = useSettingsStore(
    (s) => ({ themeId: s.themeId, nightMode: s.nightMode }),
    shallow
  );

  const isAuthInitialized = useAuthStore((s) => s.isInitialized);
  const [isSettingsHydrated, setIsSettingsHydrated] = useState(false);
  const [showSplashOverlay, setShowSplashOverlay] = useState(true);

  // Monitor Settings Hydration
  useEffect(() => {
    const checkHydration = () => {
      if (useSettingsStore.persist.hasHydrated()) {
        setIsSettingsHydrated(true);
      }
    };
    checkHydration();
    // Listen for hydration finish
    const unsub = useSettingsStore.persist.onFinishHydration(() => {
      setIsSettingsHydrated(true);
    });
    return () => unsub();
  }, []);

  // HYPER-INSTANT: Hydrate store from native pre-load props immediately
  useMemo(() => {
    if (props?.initialNotes) {
      useNotesStore.getState().bootstrap(props.initialNotes);
    }
  }, []);

  const systemColor = useColorScheme();
  const rootNavigationState = useRootNavigationState();

  const [fontsLoaded] = useFonts({
    Hind: require('../../assets/fonts/Hind-Regular.ttf'),
    'Hind-Medium': require('../../assets/fonts/Hind-Medium.ttf'),
    'Hind-SemiBold': require('../../assets/fonts/Hind-SemiBold.ttf'),
    'Hind-Bold': require('../../assets/fonts/Hind-Bold.ttf'),
  });

  const isDark = nightMode === 'dark' || (nightMode === 'system' && systemColor === 'dark');
  const finalBgColor = themes[themeId][isDark ? 'dark' : 'light'].bg;
  const coreReady = !!rootNavigationState;

  // FIVE-POINT SYNC: Wait for EVERYTHING before hiding the NATIVE splash
  const isEverythingReady = useMemo(() => {
    return coreReady && fontsLoaded && isAuthInitialized && isSettingsHydrated;
  }, [coreReady, fontsLoaded, isAuthInitialized, isSettingsHydrated]);

  useEffect(() => {
    if (isEverythingReady) {
      // Small buffer to ensure JS overlay is painted
      const timer = setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isEverythingReady]);

  useEffect(() => {
    const init = async () => {
      log.info('RootLayout: Starting atomic initialization.');
      useRuntimeUxFlagsStore.getState().loadFlags().catch(() => {});
      try {
        await useNotesStore.getState().initDB();
      } catch (e) {
        log.error('DB Init Failed', e as any);
      }
      setTimeout(() => {
        useAuthStore.getState().initialize().catch(() => {});
        useAiStore.getState().initialize().catch(() => {});
      }, 0);
    };
    init();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        useAuthStore.getState().lockApp();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(finalBgColor).catch(() => {});
  }, [finalBgColor]);

  const navTheme = useMemo(() => ({
    dark: isDark,
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: finalBgColor,
    },
    fonts: (isDark ? (DarkTheme as any).fonts : (DefaultTheme as any).fonts),
  }) as any, [isDark, finalBgColor]);

  return (
      <ThemeProvider value={navTheme}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
          <Stack.Screen name="editor/[id]" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="trash" options={{ presentation: 'modal', animation: 'slide_from_right' }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal', animation: 'slide_from_right' }} />
        </Stack>
        <LockScreen />
        <ToastPill />
        {showSplashOverlay && (
          <StaticSplash 
            themeId={themeId} 
            isDark={isDark} 
            onAnimationFinish={() => setShowSplashOverlay(false)} 
          />
        )}
      </ThemeProvider>
  );
}

export default RootLayout;
