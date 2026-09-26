import { Children, isValidElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

import { AppText } from './app-text';
import { Icon } from './icon';

export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  const c = useColors();
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <View style={styles.group}>
      {title && (
        <AppText variant="label" tone="muted" style={styles.title}>
          {title}
        </AppText>
      )}
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.line }]}>
        {items.map((child, i) => (
          <View
            key={i}
            style={i < items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: c.line } : undefined}>
            {child}
          </View>
        ))}
      </View>
    </View>
  );
}

interface ListRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
}

export function ListRow({ label, value, onPress, right }: ListRowProps) {
  const c = useColors();
  const content = (
    <>
      <AppText style={styles.rowLabel}>{label}</AppText>
      {value !== undefined && (
        <AppText tone="muted" numberOfLines={1} style={styles.rowValue}>
          {value}
        </AppText>
      )}
      {right}
      {onPress && <Icon name="chevron" size={16} color={c.muted} />}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.subtle }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.two - 2,
  },
  title: {
    paddingHorizontal: Spacing.one,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  rowLabel: {
    flex: 1,
  },
  rowValue: {
    flexShrink: 1,
  },
});
