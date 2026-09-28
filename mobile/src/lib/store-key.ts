import { Platform } from 'react-native';

/**
 * Public RevenueCat SDK keys come from env vars so none are hard-coded:
 * - EXPO_PUBLIC_REVENUECAT_TEST_KEY: RevenueCat Test Store, used in development builds only
 *   (the SDK refuses a Test Store key in release builds).
 * - EXPO_PUBLIC_REVENUECAT_APPLE_KEY / EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY: store keys for releases.
 */
export function storeKey(): string | null {
  const test = process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY;
  if (__DEV__ && test) return test;
  if (Platform.OS === 'ios') return process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || null;
  if (Platform.OS === 'android') return process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || null;
  return null;
}
