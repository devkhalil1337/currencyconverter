import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { DevTools } from '@/components/dev-tools';
import { Icon } from '@/components/icon';
import { ListGroup, ListRow } from '@/components/list-group';
import { LocaleBoundary } from '@/components/locale-boundary';
import { Screen } from '@/components/screen';
import { BottomTabInset, Font, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { nativeName, systemLanguage, t as translate, useT, type TranslationKey } from '@/i18n';
import { formatNumber, formatTime } from '@/lib/format';
import { usePrefs, type Appearance } from '@/store/prefs';
import { FREE_LAUNCH, TEST_TOOLS, useIsPro } from '@/store/pro';
import { pinRatesWidget } from '@/widgets/task-handler';
import { currencyName, useRates } from '@/store/rates';

const APPEARANCES: { value: Appearance; label: TranslationKey }[] = [
  { value: 'system', label: 'settings.appearances.system' },
  { value: 'light', label: 'settings.appearances.light' },
  { value: 'dark', label: 'settings.appearances.dark' },
];

const RATE_TYPES: { value: boolean; label: TranslationKey }[] = [
  { value: false, label: 'settings.rateTypes.midMarket' },
  { value: true, label: 'settings.rateTypes.withCardFee' },
];

// The iOS widget extension needs iOS 17, while the app itself still runs on iOS 16.
const HAS_WIDGETS =
  Platform.OS === 'android' || (Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) >= 17);

async function openWidgets(isPro: boolean) {
  if (!isPro) {
    router.push({ pathname: '/paywall', params: { reason: 'widgets' } });
  } else if (Platform.OS === 'ios') {
    Alert.alert(translate('settings.addWidgetTitle'), translate('settings.addWidgetIos'));
  } else if (!(await pinRatesWidget())) {
    // Some launchers can't pin widgets for an app, so explain the manual way.
    Alert.alert(translate('settings.addWidgetAndroidTitle'), translate('settings.addWidgetAndroid'));
  }
}

export default function SettingsRoute() {
  return (
    <LocaleBoundary>
      <SettingsScreen />
    </LocaleBoundary>
  );
}

function SettingsScreen() {
  const c = useColors();
  const t = useT();
  const { homeCurrency, cardFee, realCost, appearance, language, setCardFee, toggleRealCost, setAppearance } = usePrefs();
  const { rates, names, fetchedAt, status, refresh } = useRates();
  const rateCount = rates ? Object.keys(rates).length : 0;
  const isPro = useIsPro();

  return (
    <Screen title={t('tabs.settings')}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.pro, { backgroundColor: c.accentSoft }]}>
          <AppText style={[styles.proTitle, { color: c.accentOnSoft }]}>
            {FREE_LAUNCH ? t('settings.proUnlocked') : isPro ? t('settings.proActive') : t('settings.proTitle')}
          </AppText>
          <AppText variant="small" style={{ color: c.accentOnSoft }}>
            {FREE_LAUNCH
              ? t('settings.proBodyFree')
              : isPro
                ? t('settings.proBodyActive')
                : HAS_WIDGETS
                  ? t('settings.proBodyWidgets')
                  : t('settings.proBody')}
          </AppText>
          {!FREE_LAUNCH && (
            <Pressable
              onPress={() =>
                isPro
                  ? Linking.openURL(
                      Platform.OS === 'ios'
                        ? 'https://apps.apple.com/account/subscriptions'
                        : 'https://play.google.com/store/account/subscriptions'
                    )
                  : router.push('/paywall')
              }
              accessibilityRole="button"
              style={({ pressed }) => [styles.proButton, { backgroundColor: c.accentOnSoft, opacity: pressed ? 0.85 : 1 }]}>
              <AppText variant="bodyStrong" style={{ color: c.accentSoft }}>
                {isPro ? t('settings.manageSubscription') : t('settings.seePlans')}
              </AppText>
            </Pressable>
          )}
        </View>

        <ListGroup title={t('settings.money')}>
          <ListRow
            label={t('settings.homeCurrency')}
            value={`${homeCurrency.toUpperCase()} · ${currencyName(homeCurrency, names)}`}
            onPress={() => router.push('/currency-picker?mode=home')}
          />
          <ListRow
            label={t('settings.cardFee')}
            right={
              <View style={styles.stepper}>
                <StepButton icon="minus" label={t('settings.decreaseFee')} onPress={() => setCardFee(cardFee - 0.5)} />
                <AppText variant="bodyStrong" style={styles.stepValue}>
                  {t('common.percent', { value: formatNumber(cardFee, 1) })}
                </AppText>
                <StepButton icon="plus" label={t('settings.increaseFee')} onPress={() => setCardFee(cardFee + 0.5)} />
              </View>
            }
          />
          <View style={styles.segmentRow}>
            <AppText style={styles.segmentLabel}>{t('settings.rateType')}</AppText>
            <Segment
              label={t('settings.rateType')}
              options={RATE_TYPES.map((o) => ({ value: o.value, label: t(o.label) }))}
              value={realCost}
              onChange={(value) => {
                if (value !== realCost) toggleRealCost();
              }}
            />
          </View>
        </ListGroup>

        <ListGroup title={t('settings.app')}>
          <ListRow
            label={t('settings.offlineRates')}
            value={
              status === 'loading'
                ? t('common.updating')
                : fetchedAt
                  ? t('settings.savedAt', { count: rateCount, time: formatTime(fetchedAt) })
                  : t('settings.notDownloaded')
            }
            onPress={() => refresh(true)}
          />
          {HAS_WIDGETS ? (
            <ListRow
              label={Platform.OS === 'ios' ? t('settings.widgets') : t('settings.widget')}
              value={isPro ? t('settings.add') : undefined}
              right={isPro ? undefined : <ProPill />}
              onPress={() => openWidgets(isPro)}
            />
          ) : null}
          <View style={styles.segmentRow}>
            <AppText style={styles.segmentLabel}>{t('settings.appearance')}</AppText>
            <Segment
              label={t('settings.appearance')}
              options={APPEARANCES.map((o) => ({ value: o.value, label: t(o.label) }))}
              value={appearance}
              onChange={setAppearance}
            />
          </View>
          <ListRow
            label={t('settings.language')}
            value={
              language === 'system'
                ? t('settings.languageSystem', { language: nativeName(systemLanguage()) })
                : nativeName(language)
            }
            onPress={() => router.push('/language')}
          />
        </ListGroup>

        {TEST_TOOLS && <DevTools />}

        <View style={styles.privacy}>
          <Icon name="shield" size={18} color={c.muted} />
          <AppText variant="small" tone="muted">
            {t('settings.privacy')}
          </AppText>
        </View>
        <AppText variant="caption" tone="muted" style={styles.version}>
          Trippence {Constants.expoConfig?.version ?? ''}
        </AppText>
      </ScrollView>
    </Screen>
  );
}

function Segment<T extends string | boolean>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const c = useColors();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[styles.segment, { backgroundColor: c.subtle }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            hitSlop={{ top: 6, bottom: 6 }}
            style={[styles.segmentItem, selected && { backgroundColor: c.card }]}>
            <AppText variant="small" style={{ fontFamily: Font.semibold, color: selected ? c.ink : c.muted }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function ProPill() {
  const c = useColors();
  const t = useT();
  return (
    <View style={[styles.proPill, { backgroundColor: c.feature }]}>
      <AppText variant="caption" style={[styles.proPillText, { color: c.featureAccent }]}>
        {t('common.pro')}
      </AppText>
    </View>
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
  pro: {
    gap: Spacing.two,
    padding: Spacing.three + 2,
    borderRadius: Radius.xl - 2,
  },
  proTitle: {
    fontFamily: Font.serif,
    fontSize: 28,
    lineHeight: 32,
  },
  proButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 18,
    marginTop: Spacing.one,
    borderRadius: Radius.pill,
    justifyContent: 'center',
  },
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
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: Spacing.two,
  },
  segmentLabel: {
    flexShrink: 1,
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
  proPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  proPillText: {
    fontFamily: Font.bold,
    letterSpacing: 0.4,
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
