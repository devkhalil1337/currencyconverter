import { Pressable, StyleSheet } from 'react-native';

import { Font, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

interface ChipProps {
  label: string;
  icon?: IconName;
  active?: boolean;
  onPress: () => void;
  accessibilityHint?: string;
  /** Renders as a toggle with aria-pressed semantics. */
  toggle?: boolean;
}

export function Chip({ label, icon, active = false, onPress, accessibilityHint, toggle }: ChipProps) {
  const c = useColors();
  const fg = active ? c.accentOnSoft : c.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={toggle ? 'switch' : 'button'}
      accessibilityLabel={label}
      accessibilityState={toggle ? { checked: active } : undefined}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? c.accentSoft : 'transparent',
          borderColor: active ? c.accentSoft : c.line,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      {icon && <Icon name={icon} size={16} color={fg} />}
      <AppText variant="small" style={[styles.label, { color: fg }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  label: {
    fontFamily: Font.semibold,
  },
});
