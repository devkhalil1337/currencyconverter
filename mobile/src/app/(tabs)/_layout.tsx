import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { usePrefs } from '@/store/prefs';

export default function TabLayout() {
  const onboarded = usePrefs((s) => s.onboarded);
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <AppTabs />;
}
