import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Font } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useT } from '@/i18n';

import { AppText } from './app-text';
import { Icon } from './icon';

interface SheetHeaderProps {
  title: string;
  /** "close" for modals, "back" for pushed screens. */
  kind?: 'close' | 'back';
  right?: ReactNode;
}

export function SheetHeader({ title, kind = 'close', right }: SheetHeaderProps) {
  const c = useColors();
  const t = useT();
  const button = (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel={kind === 'close' ? t('common.close') : t('common.back')}
      style={[styles.button, { backgroundColor: c.card, borderColor: c.line }]}>
      {kind === 'close' ? (
        <Icon name="close" size={18} color={c.ink} />
      ) : (
        <View style={styles.flip}>
          <Icon name="chevron" size={20} color={c.ink} />
        </View>
      )}
    </Pressable>
  );
  return (
    <View style={styles.header}>
      {kind === 'back' && button}
      <AppText style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </AppText>
      {right}
      {kind === 'close' && button}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: Font.serif,
    fontSize: 30,
    lineHeight: 36,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
});
