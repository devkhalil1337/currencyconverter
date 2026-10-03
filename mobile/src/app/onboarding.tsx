import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Chip } from '@/components/chip';
import { CurrencyBadge } from '@/components/currency-badge';
import { Icon } from '@/components/icon';
import { Font, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useT } from '@/i18n';
import { usePrefs } from '@/store/prefs';
import { currencyName, useRates } from '@/store/rates';

const DESTINATIONS = ['eur', 'gbp', 'usd', 'jpy', 'mxn', 'cad', 'chf', 'aud', 'thb', 'aed', 'try', 'inr'];

export default function Onboarding() {
  const c = useColors();
  const t = useT();
  const { homeCurrency, completeOnboarding } = usePrefs();
  const names = useRates((s) => s.names);
  const options = DESTINATIONS.filter((code) => code !== homeCurrency);
  const [picked, setPicked] = useState<string[]>(() => options.slice(0, 2));

  const toggle = (code: string) =>
    setPicked((list) => (list.includes(code) ? list.filter((c2) => c2 !== code) : [...list, code]));

  const finish = () => {
    completeOnboarding(picked);
    router.replace('/');
  };

  return (
    <View style={[styles.outer, { backgroundColor: c.bg }]}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.brand}>
            <View style={[styles.mark, { backgroundColor: c.inverse }]}>
              <Icon name="convert" size={20} color={c.accent} strokeWidth={2.2} />
            </View>
            <AppText style={styles.brandName}>Trippence</AppText>
          </View>

          <Text style={[styles.headline, { color: c.ink }]} accessibilityRole="header">
            {t('onboarding.headline1')}
            {'\n'}
            {t('onboarding.headline2')}
            {'\n'}
            <Text style={[styles.headlineAccent, { color: c.accent }]}>{t('onboarding.headline3')}</Text>
          </Text>

          <View style={styles.section}>
            <AppText variant="label" tone="muted">
              {t('onboarding.homeCurrency')}
            </AppText>
            <View style={[styles.homeCard, { backgroundColor: c.card, borderColor: c.line }]}>
              <CurrencyBadge code={homeCurrency} size={40} />
              <View style={styles.homeNames}>
                <AppText variant="bodyStrong">{currencyName(homeCurrency, names)}</AppText>
                <AppText variant="small" tone="muted">
                  {t('onboarding.detected')}
                </AppText>
              </View>
              <Pressable
                onPress={() => router.push('/currency-picker?mode=home')}
                accessibilityRole="button"
                accessibilityLabel={t('onboarding.changeHome')}
                style={({ pressed }) => [
                  styles.change,
                  { borderColor: c.line, backgroundColor: pressed ? c.subtle : c.bg },
                ]}>
                <AppText variant="small" style={{ fontFamily: Font.semibold }}>
                  {t('onboarding.change')}
                </AppText>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="label" tone="muted">
              {t('onboarding.whereHeaded')}
            </AppText>
            <View style={styles.chips}>
              {options.map((code) => (
                <Chip
                  key={code}
                  toggle
                  icon={picked.includes(code) ? 'check' : undefined}
                  label={`${code.toUpperCase()} · ${currencyName(code, names)}`}
                  active={picked.includes(code)}
                  onPress={() => toggle(code)}
                />
              ))}
            </View>
            <AppText variant="small" tone="muted">
              {t('onboarding.addLater')}
            </AppText>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={finish}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cta, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}>
            <AppText variant="bodyStrong" tone="onAccent" style={styles.ctaText}>
              {t('onboarding.continue')}
            </AppText>
          </Pressable>
          <AppText variant="small" tone="muted" style={styles.center}>
            {t('onboarding.footer')}
          </AppText>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
  },
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  content: {
    gap: Spacing.four + 4,
    paddingHorizontal: Spacing.four - 4,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontFamily: Font.bold,
    fontSize: 18,
    lineHeight: 22,
  },
  headline: {
    fontFamily: Font.serif,
    fontSize: 48,
    lineHeight: 50,
    letterSpacing: -1,
  },
  headlineAccent: {
    fontFamily: Font.serifItalic,
  },
  section: {
    gap: 10,
  },
  homeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  homeNames: {
    flex: 1,
    minWidth: 0,
  },
  change: {
    minHeight: 40,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  footer: {
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.four - 4,
    paddingBottom: Spacing.three,
  },
  cta: {
    minHeight: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 17,
  },
  center: {
    textAlign: 'center',
  },
});
