import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { ExpenseRow } from '@/components/expense-row';
import { Icon } from '@/components/icon';
import { ListGroup } from '@/components/list-group';
import { Screen } from '@/components/screen';
import { TripCard } from '@/components/trip-card';
import { BottomTabInset, Font, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { formatCurrency } from '@/lib/format';
import { currentTrip, formatDateRange, summarize, toIsoDate, tripPhase } from '@/lib/trips';
import { usePrefs } from '@/store/prefs';
import { FREE_LIMITS, useIsPro } from '@/store/pro';
import { useTrips } from '@/store/trips';

export default function TripsScreen() {
  const c = useColors();
  const { trips, expenses } = useTrips();
  const cardFee = usePrefs((s) => s.cardFee);
  const today = toIsoDate(new Date());
  const isPro = useIsPro();
  const openNewTrip = () =>
    !isPro && trips.length >= FREE_LIMITS.trips ? router.push('/paywall?reason=trips') : router.push('/trip-new');

  const featured = currentTrip(trips, today) ?? trips[0] ?? null;
  const others = trips.filter((t) => t.id !== featured?.id).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const recent = featured ? expenses.filter((e) => e.tripId === featured.id).slice(0, 5) : [];

  const newTrip = (
    <Pressable
      onPress={openNewTrip}
      accessibilityRole="button"
      accessibilityLabel="New trip"
      style={[styles.round, { backgroundColor: c.card, borderColor: c.line }]}>
      <Icon name="plus" size={20} color={c.ink} />
    </Pressable>
  );

  if (!featured) {
    return (
      <Screen title="Trips" right={newTrip}>
        <View style={styles.pad}>
          <View style={[styles.empty, { backgroundColor: c.feature }]}>
            <Icon name="suitcase" size={28} color={c.featureAccent} />
            <AppText style={[styles.emptyTitle, { color: c.onFeature }]}>Track a trip’s spending</AppText>
            <AppText variant="small" style={{ color: c.onFeature, opacity: 0.75 }}>
              Set a budget, log what you spend in the local currency and see the total at home, card fees
              included.
            </AppText>
            <Pressable
              onPress={openNewTrip}
              accessibilityRole="button"
              style={({ pressed }) => [styles.cta, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}>
              <AppText variant="bodyStrong" tone="onAccent">
                Plan a trip
              </AppText>
            </Pressable>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Trips" right={newTrip}>
      <ScrollView contentContainerStyle={styles.content}>
        <TripCard
          trip={featured}
          summary={summarize(featured, expenses, today)}
          today={today}
          cardFee={cardFee}
          onPress={() => router.push({ pathname: '/trip/[id]', params: { id: featured.id } })}
        />

        <Pressable
          onPress={() => router.push(`/expense-new?tripId=${featured.id}`)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.add, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}>
          <Icon name="plus" size={18} color={c.onAccent} strokeWidth={2.2} />
          <AppText variant="bodyStrong" tone="onAccent">
            Add expense
          </AppText>
        </Pressable>

        {recent.length > 0 && (
          <ListGroup title="Recent">
            {recent.map((e) => (
              <ExpenseRow key={e.id} expense={e} currency={featured.currency} homeCurrency={featured.homeCurrency} />
            ))}
          </ListGroup>
        )}
        {recent.length > 0 && (
          <Pressable onPress={() => router.push({ pathname: '/trip/[id]', params: { id: featured.id } })} accessibilityRole="button" hitSlop={8}>
            <AppText variant="bodyStrong" tone="accent" style={styles.center}>
              See all expenses
            </AppText>
          </Pressable>
        )}

        {others.length > 0 && (
          <ListGroup title="Other trips">
            {others.map((t) => {
              const s = summarize(t, expenses, today);
              const phase = tripPhase(t, today);
              return (
                <Pressable
                  key={t.id}
                  onPress={() => router.push({ pathname: '/trip/[id]', params: { id: t.id } })}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.subtle }]}>
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {t.name}
                    </AppText>
                    <AppText variant="small" tone="muted">
                      {formatDateRange(t)}
                      {phase === 'upcoming' ? ' · Upcoming' : ''}
                    </AppText>
                  </View>
                  <View style={styles.amounts}>
                    <AppText variant="bodyStrong">{formatCurrency(s.spent, t.currency)}</AppText>
                    <AppText variant="small" tone="muted">
                      {formatCurrency(s.spentHome, t.homeCurrency)}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </ListGroup>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: {
    paddingHorizontal: Spacing.three,
  },
  content: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.xl,
  },
  emptyTitle: {
    fontFamily: Font.serif,
    fontSize: 30,
    lineHeight: 34,
  },
  cta: {
    marginTop: Spacing.two,
    minHeight: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 14,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  amounts: {
    alignItems: 'flex-end',
  },
});
