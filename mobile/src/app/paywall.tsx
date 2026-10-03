import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { PACKAGE_TYPE } from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { SheetHeader } from '@/components/sheet-header';
import { Font, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { t, useT } from '@/i18n';
import { buy, loadPackages, loadTrials, purchasesAvailable, restore } from '@/lib/purchases';
import { billingPeriod, fullPrice, trialSpan, type Period } from '@/lib/trial';
import { FREE_LAUNCH, FREE_LIMITS, useIsPro, usePro } from '@/store/pro';

const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL;

function reasonText(reason: string | undefined): string | null {
  switch (reason) {
    case 'alerts':
      return t('paywall.reasons.alerts', { count: FREE_LIMITS.activeAlerts });
    case 'trips':
      return t('paywall.reasons.trips', { count: FREE_LIMITS.trips });
    case 'history':
    case 'export':
    case 'scan':
    case 'widgets':
      return t(`paywall.reasons.${reason}`);
    default:
      return null;
  }
}

// Only promise widgets where they exist: the iOS extension needs iOS 17, and web has none.
const WIDGETS =
  Platform.OS === 'android'
    ? (['paywall.benefits.widgetAndroid'] as const)
    : Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) >= 17
      ? (['paywall.benefits.widgetsIos'] as const)
      : [];

const BENEFITS = [
  ...WIDGETS,
  'paywall.benefits.trips',
  'paywall.benefits.pastRates',
  'paywall.benefits.alerts',
] as const;

/** "$14.99/year", "$9.99 every 3 months", or just the price when the period is unknown. */
function pricePer(price: string, period: Period | null): string {
  if (!period) return price;
  const unit = ({ DAY: 'day', WEEK: 'week', MONTH: 'month', YEAR: 'year' } as const)[period.unit];
  return t(`paywall.pricePer.${unit}`, { price, count: period.count });
}

function planLabel(pkg: PurchasesPackage, trial: Period | undefined): { name: string; note: string } {
  const { name, note } = basePlanLabel(pkg);
  const span = trial ? trialSpan(trial) : null;
  const lead = span ? t(`paywall.freeTrial.${span.unit}`, { count: span.count }) : '';
  return { name, note: [lead, note].filter(Boolean).join(' · ') };
}

function basePlanLabel(pkg: PurchasesPackage): { name: string; note: string } {
  switch (pkg.packageType) {
    case PACKAGE_TYPE.ANNUAL:
      return {
        name: t('paywall.plans.yearly'),
        note: pkg.product.pricePerMonthString
          ? t('paywall.plans.perMonth', { price: pkg.product.pricePerMonthString })
          : t('paywall.plans.billedYearly'),
      };
    case PACKAGE_TYPE.MONTHLY:
      return { name: t('paywall.plans.monthly'), note: t('paywall.plans.billedMonthly') };
    case PACKAGE_TYPE.LIFETIME:
      return { name: t('paywall.plans.lifetime'), note: t('paywall.plans.payOnce') };
    default:
      return { name: pkg.product.title, note: '' };
  }
}

function checkout(pkg: PurchasesPackage | null, trial: Period | undefined): { cta: string; fine: string | null } {
  if (!pkg) return { cta: t('paywall.subscribe'), fine: null };
  if (pkg.packageType === PACKAGE_TYPE.LIFETIME) {
    return { cta: t('paywall.buyLifetime'), fine: t('paywall.lifetimeFine') };
  }
  if (trial) {
    const span = trialSpan(trial);
    const renewal = pricePer(fullPrice(pkg.product), billingPeriod(pkg.packageType, pkg.product.subscriptionPeriod));
    return {
      cta: t(`paywall.startTrial.${span.unit}`, { count: span.count }),
      fine: t('paywall.trialFine', { price: renewal }),
    };
  }
  return { cta: t('paywall.subscribe'), fine: t('paywall.renewFine') };
}

export default function Paywall() {
  const c = useColors();
  const t = useT();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const isPro = useIsPro();
  const setPro = usePro((s) => s.setPro);
  const available = purchasesAvailable();

  const [packages, setPackages] = useState<PurchasesPackage[] | null>(available ? null : []);
  const [trials, setTrials] = useState<Record<string, Period>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!available) return;
    loadPackages()
      .then(async (list) => {
        setTrials(await loadTrials(list));
        setPackages(list);
        setSelected((list.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ?? list[0])?.identifier ?? null);
      })
      .catch(() => {
        setPackages([]);
        setMessage(t('paywall.loadFailed'));
      });
  }, [available, t]);

  const chosen = packages?.find((p) => p.identifier === selected) ?? null;
  const reasonLine = reasonText(reason);
  const { cta, fine } = checkout(chosen, chosen ? trials[chosen.identifier] : undefined);

  const purchase = async () => {
    if (!chosen) return;
    setBusy(true);
    setMessage(null);
    const result = await buy(chosen);
    setBusy(false);
    if (result === 'purchased') {
      setPro(true);
      // Widgets deep-link here, so on a cold start there may be nothing to go back to.
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } else if (result === 'failed') {
      setMessage(t('paywall.purchaseFailed'));
    }
  };

  const restorePurchases = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const restored = await restore();
      setPro(restored);
      setMessage(restored ? t('paywall.restored') : t('paywall.nothingToRestore'));
    } catch {
      setMessage(t('paywall.restoreFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.inner}>
        <SheetHeader title="" />
        <Text style={[styles.title, { color: c.ink }]} accessibilityRole="header">
          Trippence <Text style={{ color: c.accent, fontFamily: Font.serifItalic }}>Pro</Text>
        </Text>
        <AppText tone="muted">
          {reasonLine ? `${reasonLine} ` : ''}
          {t('paywall.tagline')}
        </AppText>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b} style={styles.benefit}>
              <Icon name="check" size={20} color={c.accent} strokeWidth={2.4} />
              <AppText style={styles.flex}>{t(b)}</AppText>
            </View>
          ))}
        </View>

        {FREE_LAUNCH ? (
          <View style={[styles.notice, { backgroundColor: c.accentSoft }]}>
            <AppText variant="bodyStrong" style={{ color: c.accentOnSoft }}>
              {t('paywall.freeNowTitle')}
            </AppText>
            <AppText variant="small" style={{ color: c.accentOnSoft }}>
              {t('paywall.freeNowBody')}
            </AppText>
          </View>
        ) : isPro ? (
          <View style={[styles.notice, { backgroundColor: c.accentSoft }]}>
            <AppText variant="bodyStrong" style={{ color: c.accentOnSoft }}>
              {t('paywall.thanks')}
            </AppText>
          </View>
        ) : !available ? (
          <View style={[styles.notice, { backgroundColor: c.subtle }]}>
            <AppText variant="bodyStrong">{t('paywall.unavailableTitle')}</AppText>
            <AppText variant="small" tone="muted">
              {t('paywall.unavailableBody')}
            </AppText>
          </View>
        ) : packages === null ? (
          <ActivityIndicator color={c.accent} />
        ) : (
          <View accessibilityRole="radiogroup" style={styles.plans}>
            {packages.map((pkg) => {
              const on = pkg.identifier === selected;
              const { name, note } = planLabel(pkg, trials[pkg.identifier]);
              const best = pkg.packageType === PACKAGE_TYPE.ANNUAL && packages.length > 1;
              return (
                <Pressable
                  key={pkg.identifier}
                  onPress={() => setSelected(pkg.identifier)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  style={[
                    styles.plan,
                    { borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accentSoft : c.card },
                  ]}>
                  <View style={[styles.radio, { borderColor: on ? c.accent : c.line }]}>
                    {on && <View style={[styles.dot, { backgroundColor: c.accent }]} />}
                  </View>
                  <View style={styles.flex}>
                    <View style={styles.planName}>
                      <AppText variant="bodyStrong">{name}</AppText>
                      {best && (
                        <View style={[styles.pill, { backgroundColor: c.accent }]}>
                          <AppText variant="caption" tone="onAccent" style={styles.pillText}>
                            {t('paywall.bestValue')}
                          </AppText>
                        </View>
                      )}
                    </View>
                    {note ? (
                      <AppText variant="small" tone="muted">
                        {note}
                      </AppText>
                    ) : null}
                  </View>
                  <AppText variant="bodyStrong">{fullPrice(pkg.product)}</AppText>
                </Pressable>
              );
            })}
          </View>
        )}

        {message && (
          <AppText variant="small" tone="muted" style={styles.center}>
            {message}
          </AppText>
        )}

        {!isPro && available && (
          <Pressable
            onPress={purchase}
            disabled={!chosen || busy}
            accessibilityRole="button"
            accessibilityState={{ disabled: !chosen || busy }}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: chosen ? c.accent : c.subtle, opacity: pressed || busy ? 0.8 : 1 },
            ]}>
            {busy ? (
              <ActivityIndicator color={c.onAccent} />
            ) : (
              <AppText variant="bodyStrong" tone={chosen ? 'onAccent' : 'muted'} style={styles.ctaText}>
                {cta}
              </AppText>
            )}
          </Pressable>
        )}
        {!isPro && fine && (
          <AppText variant="caption" tone="muted" style={styles.center}>
            {fine}
          </AppText>
        )}

        <View style={styles.links}>
          {available && (
            <Pressable onPress={restorePurchases} disabled={busy} accessibilityRole="button" hitSlop={8}>
              <AppText variant="small" tone="accent" style={{ fontFamily: Font.semibold }}>
                {t('paywall.restore')}
              </AppText>
            </Pressable>
          )}
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} accessibilityRole="link" hitSlop={8}>
            <AppText variant="small" tone="muted">
              {t('paywall.terms')}
            </AppText>
          </Pressable>
          {PRIVACY_URL ? (
            <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} accessibilityRole="link" hitSlop={8}>
              <AppText variant="small" tone="muted">
                {t('paywall.privacy')}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three + 4,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  title: {
    fontFamily: Font.serif,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -0.5,
  },
  benefits: {
    gap: 12,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  notice: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  plans: {
    gap: Spacing.two,
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  planName: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  pillText: {
    fontFamily: Font.bold,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.four,
  },
});
