import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useLocaleKey } from '@/i18n';
import { usePrefs } from '@/store/prefs';

export default function TabLayout() {
  const onboarded = usePrefs((s) => s.onboarded);
  // The native tab bar sizes its labels once; rebuild it when the language changes so
  // longer words (e.g. German) are not cut off.
  const localeKey = useLocaleKey();
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <AppTabs key={localeKey} />;
}
