import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useColors } from '@/hooks/use-colors';

/** System tab bar: Liquid Glass on iOS 26+, Material 3 on Android. */
export default function AppTabs() {
  const c = useColors();
  return (
    <NativeTabs tintColor={c.accent} iconColor={{ default: c.muted, selected: c.accent }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Convert</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="arrow.left.arrow.right" md="swap_horiz" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="rates">
        <NativeTabs.Trigger.Label>Rates</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.line.uptrend.xyaxis" md="show_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="trips">
        <NativeTabs.Trigger.Label>Trips</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="suitcase" md="luggage" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
