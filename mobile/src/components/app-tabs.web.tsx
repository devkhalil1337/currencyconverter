import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps, type TabListProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { Font, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

/** Web has no system tab bar, so draw the floating pill from the mockups. */
export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <FloatingTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="convert">Convert</TabButton>
          </TabTrigger>
          <TabTrigger name="rates" href="/rates" asChild>
            <TabButton icon="chart">Rates</TabButton>
          </TabTrigger>
          <TabTrigger name="trips" href="/trips" asChild>
            <TabButton icon="suitcase">Trips</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton icon="sliders">Settings</TabButton>
          </TabTrigger>
        </FloatingTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, icon, ...props }: TabTriggerSlotProps & { icon: IconName }) {
  const c = useColors();
  const color = isFocused ? c.onInverse : c.muted;
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.tab,
        { backgroundColor: isFocused ? c.inverse : 'transparent', opacity: pressed ? 0.8 : 1 },
      ]}>
      <Icon name={icon} size={20} color={color} strokeWidth={1.9} />
      <AppText variant="caption" style={{ color, fontFamily: isFocused ? Font.semibold : Font.medium }}>
        {children}
      </AppText>
    </Pressable>
  );
}

function FloatingTabList(props: TabListProps) {
  const c = useColors();
  return (
    <View {...props} style={styles.container}>
      <View
        style={[
          styles.bar,
          { backgroundColor: c.card, borderColor: c.line, boxShadow: '0 8px 24px rgba(21,23,28,0.10)' },
        ]}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  bar: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: MaxContentWidth - Spacing.five,
    height: 64,
    padding: 6,
    gap: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 26,
  },
});
