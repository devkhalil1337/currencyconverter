import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Font, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { parseRateInput, suggestTarget, validateTarget, type Direction } from '@/lib/alerts';
import { checkAlerts } from '@/lib/check-alerts';
import { formatRate } from '@/lib/format';
import { requestNotificationPermission, type PermissionState } from '@/lib/notifications';
import { activeAlertCount, MAX_ALERTS, useAlerts } from '@/store/alerts';
import { FREE_LIMITS, useIsPro } from '@/store/pro';

import { AppText } from './app-text';
import { Icon } from './icon';
import { ListGroup } from './list-group';

interface RateAlertsProps {
  from: string;
  to: string;
  /** Current rate for 1 `from` in `to`, if known. */
  live: number | null;
  onSelectPair: (from: string, to: string) => void;
}

export function RateAlerts({ from, to, live, onSelectPair }: RateAlertsProps) {
  const alerts = useAlerts((s) => s.alerts);
  const { remove, rearm } = useAlerts();

  return (
    <View style={styles.wrap}>
      <AlertForm key={`${from}:${to}`} from={from} to={to} live={live} full={alerts.length >= MAX_ALERTS} />

      {alerts.length > 0 && (
        <ListGroup title="Your alerts">
          {alerts.map((alert) => (
            <AlertRow
              key={alert.id}
              pair={`${alert.from.toUpperCase()}/${alert.to.toUpperCase()}`}
              condition={`${alert.direction === 'above' ? 'Above' : 'Below'} ${formatRate(alert.target)}`}
              triggeredAt={alert.triggeredAt}
              onPress={() => onSelectPair(alert.from, alert.to)}
              onRearm={() => rearm(alert.id)}
              onRemove={() => remove(alert.id)}
            />
          ))}
        </ListGroup>
      )}
      <AppText variant="caption" tone="muted">
        Alerts use daily reference rates and are checked when you open the app and about every 15 minutes in the
        background.
      </AppText>
    </View>
  );
}

function AlertForm({ from, to, live, full }: { from: string; to: string; live: number | null; full: boolean }) {
  const c = useColors();
  const add = useAlerts((s) => s.add);
  const active = useAlerts((s) => activeAlertCount(s.alerts));
  const isPro = useIsPro();
  const atFreeLimit = !isPro && active >= FREE_LIMITS.activeAlerts;
  const [direction, setDirection] = useState<Direction>('above');
  const [text, setText] = useState(() => (live ? formatRate(suggestTarget('above', live)).replace(/,/g, '') : ''));
  const [edited, setEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [saved, setSaved] = useState(false);

  const pickDirection = (d: Direction) => {
    setDirection(d);
    setError(null);
    if (!edited && live) setText(formatRate(suggestTarget(d, live)).replace(/,/g, ''));
  };

  const create = async () => {
    if (atFreeLimit) {
      router.push('/paywall?reason=alerts');
      return;
    }
    const target = parseRateInput(text);
    const problem = validateTarget(direction, target, live);
    if (problem) {
      setError(problem);
      return;
    }
    add({ from, to, direction, target });
    setError(null);
    setEdited(false);
    setSaved(true);
    setPermission(await requestNotificationPermission());
    // The rate may already be past a target entered before rates loaded.
    checkAlerts();
  };

  return (
    <View style={[styles.form, { backgroundColor: c.card, borderColor: c.line }]}>
      <View style={styles.formHeader}>
        <View style={[styles.bell, { backgroundColor: c.accentSoft }]}>
          <Icon name="bell" size={18} color={c.accentOnSoft} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">
            Alert me when {from.toUpperCase()}/{to.toUpperCase()}
          </AppText>
          <AppText variant="small" tone="muted">
            Now {live !== null ? formatRate(live) : '—'}
          </AppText>
        </View>
      </View>

      <View style={styles.formRow}>
        <View accessibilityRole="radiogroup" style={[styles.segment, { backgroundColor: c.subtle }]}>
          {(['above', 'below'] as const).map((d) => {
            const selected = d === direction;
            return (
              <Pressable
                key={d}
                onPress={() => pickDirection(d)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                style={[styles.segmentItem, selected && { backgroundColor: c.card }]}>
                <AppText variant="small" style={{ fontFamily: Font.semibold, color: selected ? c.ink : c.muted }}>
                  {d === 'above' ? 'Rises above' : 'Falls below'}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t);
            setEdited(true);
            setError(null);
            setSaved(false);
          }}
          keyboardType="decimal-pad"
          placeholder="Target"
          placeholderTextColor={c.muted}
          accessibilityLabel="Target rate"
          style={[styles.input, { color: c.ink, borderColor: error ? c.danger : c.line, backgroundColor: c.bg }]}
        />
      </View>

      {error && (
        <AppText variant="small" tone="danger">
          {error}
        </AppText>
      )}

      <Pressable
        onPress={create}
        disabled={full}
        accessibilityRole="button"
        accessibilityState={{ disabled: full }}
        style={({ pressed }) => [
          styles.create,
          { backgroundColor: full ? c.subtle : c.accent, opacity: pressed ? 0.85 : 1 },
        ]}>
        <AppText variant="bodyStrong" tone={full ? 'muted' : 'onAccent'}>
          {full ? `Limit of ${MAX_ALERTS} alerts reached` : atFreeLimit ? 'Unlock more alerts with Pro' : 'Create alert'}
        </AppText>
      </Pressable>
      {!isPro && !full && (
        <AppText variant="caption" tone="muted">
          {Math.min(active, FREE_LIMITS.activeAlerts)} of {FREE_LIMITS.activeAlerts} free alerts in use
        </AppText>
      )}

      {saved && permission === 'granted' && (
        <AppText variant="small" tone="accent">
          Alert saved. We’ll notify you when it’s reached.
        </AppText>
      )}
      {saved && permission === 'unsupported' && (
        <AppText variant="small" tone="muted">
          Alert saved. This preview can’t send notifications, so it will show as Reached in the list below.
        </AppText>
      )}
      {saved && (permission === 'denied' || permission === 'undetermined') && (
        <View style={styles.permission}>
          <AppText variant="small" tone="muted" style={styles.flex}>
            Alert saved, but notifications are off. Turn them on to hear about it.
          </AppText>
          <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button" hitSlop={8}>
            <AppText variant="small" tone="accent" style={{ fontFamily: Font.semibold }}>
              Settings
            </AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

interface AlertRowProps {
  pair: string;
  condition: string;
  triggeredAt: number | null;
  onPress: () => void;
  onRearm: () => void;
  onRemove: () => void;
}

function AlertRow({ pair, condition, triggeredAt, onPress, onRearm, onRemove }: AlertRowProps) {
  const c = useColors();
  const status = triggeredAt
    ? `Reached ${new Date(triggeredAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}`
    : 'Watching';
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${pair}, ${condition}, ${status}`}
        style={styles.rowMain}>
        <AppText variant="bodyStrong">{pair}</AppText>
        <AppText variant="small" tone="muted">
          {condition}
        </AppText>
      </Pressable>
      <View
        style={[styles.status, { backgroundColor: triggeredAt ? c.accentSoft : c.subtle }]}>
        <AppText variant="caption" style={{ color: triggeredAt ? c.accentOnSoft : c.muted }}>
          {status}
        </AppText>
      </View>
      {triggeredAt !== null && (
        <Pressable onPress={onRearm} accessibilityRole="button" accessibilityLabel={`Re-arm ${pair} alert`} hitSlop={6} style={styles.iconButton}>
          <Icon name="refresh" size={18} color={c.muted} />
        </Pressable>
      )}
      <Pressable onPress={onRemove} accessibilityRole="button" accessibilityLabel={`Delete ${pair} alert`} hitSlop={6} style={styles.iconButton}>
        <Icon name="close" size={18} color={c.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.three,
  },
  form: {
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bell: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  segment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: Radius.sm + 2,
  },
  segmentItem: {
    minHeight: 38,
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: Radius.sm + 2,
    borderWidth: 1,
    fontFamily: Font.semibold,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  create: {
    minHeight: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permission: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 60,
    paddingHorizontal: 14,
  },
  rowMain: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  status: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
