import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { ListGroup, ListRow } from '@/components/list-group';
import { Screen } from '@/components/screen';
import { BottomTabInset, Font, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { formatTime } from '@/lib/format';
import { usePrefs, type Appearance } from '@/store/prefs';
import { currencyName, useRates } from '@/store/rates';

const APPEARANCES: { value: Appearance; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const c = useColors();
  const { homeCurrency, cardFee, appearance, setCardFee, setAppearance } = usePrefs();
  const { rates, names, fetchedAt, status, refresh } = useRates();
  const rateCount = rates ? Object.keys(rates).length : 0;

  return (
    <Screen title="Settings">
      <ScrollView contentContainerStyle={styles.content}>
        <ListGroup title="Money">
          <ListRow
            label="Home currency"
            value={`${homeCurrency.toUpperCase()} · ${currencyName(homeCurrency, names)}`}
            onPress={() => router.push('/currency-picker?mode=home')}
          />
          <ListRow
            label="Card fee for Real cost"
            right={
              <View style={styles.stepper}>
                <StepButton icon="minus" label="Decrease card fee" onPress={() => setCardFee(cardFee - 0.5)} />
                <AppText variant="bodyStrong" style={styles.stepValue}>
                  {cardFee.toFixed(1)}%
                </AppText>
                <StepButton icon="plus" label="Increase card fee" onPress={() => setCardFee(cardFee + 0.5)} />
              </View>
            }
          />
        </ListGroup>

        <ListGroup title="App">
          <View style={styles.appearanceRow}>
            <AppText>Appearance</AppText>
            <View
              accessibilityRole="radiogroup"
              style={[styles.segment, { backgroundColor: c.subtle }]}>
              {APPEARANCES.map((option) => {
                const selected = option.value === appearance;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setAppearance(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    style={[styles.segmentItem, selected && { backgroundColor: c.card }]}>
                    <AppText
                      variant="small"
                      style={{ fontFamily: Font.semibold, color: selected ? c.ink : c.muted }}>
                      {option.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <ListRow
            label="Offline rates"
            value={
              status === 'loading'
                ? 'Updating…'
                : fetchedAt
                  ? `${rateCount} saved · ${formatTime(fetchedAt)}`
                  : 'Not downloaded yet'
            }
            onPress={() => refresh(true)}
          />
        </ListGroup>

        <View style={styles.privacy}>
          <Icon name="shield" size={18} color={c.muted} />
          <AppText variant="small" tone="muted">
            No account. No ads. No tracking.
          </AppText>
        </View>
        <AppText variant="caption" tone="muted" style={styles.version}>
          Fairrate {Constants.expoConfig?.version ?? ''}
        </AppText>
      </ScrollView>
    </Screen>
  );
}

function StepButton({ icon, label, onPress }: { icon: 'plus' | 'minus'; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.stepButton, { borderColor: c.line, backgroundColor: pressed ? c.subtle : c.bg }]}>
      <Icon name={icon} size={16} color={c.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four - 4,
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepValue: {
    minWidth: 44,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appearanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    minHeight: 56,
    paddingHorizontal: 14,
  },
  segment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: Radius.sm + 2,
  },
  segmentItem: {
    minHeight: 32,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.two,
  },
  version: {
    paddingHorizontal: Spacing.two,
  },
});
