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
import { usePrefs } from '@/store/prefs';
import { useRates } from '@/store/rates';

SplashScreen.preventAutoHideAsync();

function useStoresHydrated() {
  const check = () => usePrefs.persist.hasHydrated() && useRates.persist.hasHydrated();
  const [hydrated, setHydrated] = useState(check);
  useEffect(() => {
    const update = () => setHydrated(check());
    const unsubs = [usePrefs.persist.onFinishHydration(update), useRates.persist.onFinishHydration(update)];
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
        <Stack.Screen
          name="currency-picker"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.9],
            sheetGrabberVisible: true,
            contentStyle: { backgroundColor: palette.bg },
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
