import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { ExpenseRow } from '@/components/expense-row';
import { Icon } from '@/components/icon';
import { ListGroup } from '@/components/list-group';
import { SheetHeader } from '@/components/sheet-header';
import { TripCard } from '@/components/trip-card';
import { Font, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { appLocale, t, useT } from '@/i18n';
import { exportFileName, tripCsv } from '@/lib/csv';
import { shareCsv } from '@/lib/export-file';
import { summarize, toIsoDate, type Expense } from '@/lib/trips';
import { usePrefs } from '@/store/prefs';
import { useIsPro } from '@/store/pro';
import { useTrips } from '@/store/trips';

function confirm(message: string, action: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onConfirm();
    return;
  }
  Alert.alert(message, undefined, [
    { text: t('common.cancel'), style: 'cancel' },
    { text: action, style: 'destructive', onPress: onConfirm },
  ]);
}

function dayLabel(timestamp: number, today: string): string {
  const iso = toIsoDate(new Date(timestamp));
  if (iso === today) return t('trip.today');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (iso === toIsoDate(yesterday)) return t('trip.yesterday');
  return new Date(timestamp).toLocaleDateString(appLocale(), { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function TripDetail() {
  const c = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trips, expenses, deleteTrip, deleteExpense } = useTrips();
  const cardFee = usePrefs((s) => s.cardFee);
  const isPro = useIsPro();
  const trip = trips.find((t) => t.id === id);
  const today = toIsoDate(new Date());

  if (!trip) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
        <View style={styles.inner}>
          <SheetHeader title={t('trip.title')} kind="back" />
          <AppText tone="muted">{t('trip.missing')}</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const own = expenses.filter((e) => e.tripId === trip.id);
  const groups: { label: string; items: Expense[] }[] = [];
  for (const e of own) {
    const label = dayLabel(e.createdAt, today);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(e);
    else groups.push({ label, items: [e] });
  }

  const exportCsv = async () => {
    if (!isPro) {
      router.push({ pathname: '/paywall', params: { reason: 'export' } });
      return;
    }
    try {
      const result = await shareCsv(exportFileName([trip.name], today, 'trip'), tripCsv(trip, expenses), trip.name);
      if (result === 'unavailable') Alert.alert(t('errors.sharingUnavailable'));
    } catch {
      Alert.alert(t('trip.exportFailed'), t('errors.pleaseTryAgain'));
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.inner, { paddingBottom: Spacing.six + insets.bottom }]}>
        <SheetHeader title={t('trip.title')} kind="back" />
        <TripCard trip={trip} summary={summarize(trip, expenses, today)} today={today} cardFee={cardFee} />

        <Pressable
          onPress={() => router.push(`/expense-new?tripId=${trip.id}`)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.add, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}>
          <Icon name="plus" size={18} color={c.onAccent} strokeWidth={2.2} />
          <AppText variant="bodyStrong" tone="onAccent">
            {t('trips.addExpense')}
          </AppText>
        </Pressable>

        {groups.length === 0 ? (
          <AppText tone="muted" style={styles.center}>
            {t('trip.noExpenses')}
          </AppText>
        ) : (
          groups.map((g) => (
            <ListGroup key={g.label} title={g.label}>
              {g.items.map((e) => (
                <ExpenseRow
                  key={e.id}
                  expense={e}
                  currency={trip.currency}
                  homeCurrency={trip.homeCurrency}
                  onLongPress={() =>
                    confirm(
                      t('trip.deleteExpense', { title: e.title || t('trip.untitledExpense') }),
                      t('common.delete'),
                      () => deleteExpense(e.id)
                    )
                  }
                />
              ))}
            </ListGroup>
          ))
        )}
        {groups.length > 0 && (
          <AppText variant="caption" tone="muted" style={styles.center}>
            {t('trip.longPressHint')}
          </AppText>
        )}

        <View style={styles.actions}>
          {own.length > 0 && (
            <Pressable
              onPress={exportCsv}
              accessibilityRole="button"
              accessibilityHint={isPro ? t('trip.exportHint') : t('common.requiresPro')}
              style={({ pressed }) => [styles.action, { borderColor: c.line, opacity: pressed ? 0.7 : 1 }]}>
              <Icon name="share" size={18} color={c.ink} />
              <AppText variant="bodyStrong">{t('trip.exportCsv')}</AppText>
              {!isPro && (
                <View style={[styles.proPill, { backgroundColor: c.feature }]}>
                  <AppText variant="caption" style={[styles.proText, { color: c.featureAccent }]}>
                    {t('common.pro')}
                  </AppText>
                </View>
              )}
            </Pressable>
          )}
          <Pressable
            onPress={() =>
              confirm(t('trip.deleteTripConfirm', { name: trip.name }), t('trip.deleteTrip'), () => {
                deleteTrip(trip.id);
                router.back();
              })
            }
            accessibilityRole="button"
            style={({ pressed }) => [styles.action, { borderColor: c.line, opacity: pressed ? 0.7 : 1 }]}>
            <Icon name="trash" size={18} color={c.danger} />
            <AppText variant="bodyStrong" tone="danger">
              {t('trip.deleteTrip')}
            </AppText>
          </Pressable>
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
    gap: Spacing.three,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  add: {
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  action: {
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  proText: {
    fontFamily: Font.bold,
    letterSpacing: 0.6,
  },
});
