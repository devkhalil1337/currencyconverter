import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useColors } from '@/hooks/use-colors';
import { useT } from '@/i18n';

/** System tab bar: Liquid Glass on iOS 26+, Material 3 on Android. */
export default function AppTabs() {
  const c = useColors();
  const t = useT();
  return (
    <NativeTabs
      backgroundColor={c.card}
      indicatorColor={c.accentSoft}
      rippleColor={c.subtle}
      tintColor={c.accent}
      iconColor={{ default: c.muted, selected: c.accent }}
      labelStyle={{ default: { color: c.muted }, selected: { color: c.accent } }}
      labelVisibilityMode="labeled">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tabs.convert')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="arrow.left.arrow.right" md="swap_horiz" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="rates">
        <NativeTabs.Trigger.Label>{t('tabs.rates')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.line.uptrend.xyaxis" md="show_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="trips">
        <NativeTabs.Trigger.Label>{t('tabs.trips')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="suitcase" md="luggage" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t('tabs.settings')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
