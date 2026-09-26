import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from '@expo-google-fonts/geist';
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Appearance, AppState, Platform } from 'react-native';

import { Palette } from '@/constants/theme';
import { useIsDark } from '@/hooks/use-colors';
import { checkAlerts } from '@/lib/check-alerts';
import { configureForegroundNotifications } from '@/lib/notifications';
import { activeAlertCount, useAlerts } from '@/store/alerts';
import { usePrefs } from '@/store/prefs';
import { useRates } from '@/store/rates';
import { syncAlertTask } from '@/tasks/rate-alerts';

SplashScreen.preventAutoHideAsync();
configureForegroundNotifications();

function useStoresHydrated() {
  const check = () =>
    usePrefs.persist.hasHydrated() && useRates.persist.hasHydrated() && useAlerts.persist.hasHydrated();
  const [hydrated, setHydrated] = useState(check);
  useEffect(() => {
    const update = () => setHydrated(check());
    const unsubs = [
      usePrefs.persist.onFinishHydration(update),
      useRates.persist.onFinishHydration(update),
      useAlerts.persist.onFinishHydration(update),
    ];
    update();
    return () => unsubs.forEach((unsub) => unsub());
  }, []);
  return hydrated;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });
  const appearance = usePrefs((s) => s.appearance);
  const isDark = useIsDark();
  const refresh = useRates((s) => s.refresh);

  // Let native chrome (tab bar, sheets, keyboard) follow the in-app choice.
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Appearance.setColorScheme(appearance === 'system' ? 'unspecified' : appearance);
    }
  }, [appearance]);

  const hydrated = useStoresHydrated();

  // Refresh only after the persisted cache has loaded, so hydration can't
  // overwrite freshly fetched rates with older saved ones.
  useEffect(() => {
    if (!hydrated) return;
    refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [hydrated, refresh]);

  // Each successful rates refresh is a chance for an alert to fire.
  const fetchedAt = useRates((s) => s.fetchedAt);
  useEffect(() => {
    if (hydrated && fetchedAt) checkAlerts();
  }, [hydrated, fetchedAt]);

  const activeAlerts = useAlerts((s) => activeAlertCount(s.alerts));
  useEffect(() => {
    if (!hydrated) return;
    syncAlertTask(activeAlerts > 0).catch((err) => console.warn('Alert task sync failed', err));
  }, [hydrated, activeAlerts]);

  const ready = (fontsLoaded || !!fontError) && hydrated;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const palette = isDark ? Palette.dark : Palette.light;
  const navTheme = isDark ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...navTheme,
        colors: { ...navTheme.colors, background: palette.bg, card: palette.card, text: palette.ink, primary: palette.accent, border: palette.line },
      }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen
          name="currency-picker"
          options={
            // Android's form sheet collapses when the search keyboard opens,
            // so use a full-screen modal there.
            Platform.OS === 'ios'
              ? {
                  presentation: 'formSheet',
                  sheetAllowedDetents: [0.9],
                  sheetGrabberVisible: true,
                  contentStyle: { backgroundColor: palette.bg },
                }
              : {
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                  contentStyle: { backgroundColor: palette.bg },
                }
          }
        />
      </Stack>
    </ThemeProvider>
  );
}
