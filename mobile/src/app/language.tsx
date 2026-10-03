import { router } from 'expo-router';
import { FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { Font, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { nativeName, SUPPORTED, systemLanguage, useT, type LanguagePref } from '@/i18n';
import { usePrefs } from '@/store/prefs';

const OPTIONS: LanguagePref[] = ['system', ...SUPPORTED.map((l) => l.code)];

export default function LanguagePicker() {
  const c = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = usePrefs();

  const choose = (value: LanguagePref) => {
    setLanguage(value);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.inner, Platform.OS === 'android' && { paddingTop: insets.top + Spacing.three }]}>
        <View style={styles.header}>
          <AppText style={styles.title} accessibilityRole="header">
            {t('language.title')}
          </AppText>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            style={[styles.close, { backgroundColor: c.card, borderColor: c.line }]}>
            <Icon name="close" size={18} color={c.ink} />
          </Pressable>
        </View>

        <FlatList
          data={OPTIONS}
          keyExtractor={(value) => value}
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.four }}
          renderItem={({ item: value }) => {
            const selected = value === language;
            const name = value === 'system' ? t('language.system') : nativeName(value);
            const detail = value === 'system' ? nativeName(systemLanguage()) : null;
            return (
              <Pressable
                onPress={() => choose(value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={detail ? `${name}, ${detail}` : name}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.subtle }]}>
                <View style={styles.names}>
                  <AppText variant="bodyStrong">{name}</AppText>
                  {detail && (
                    <AppText variant="small" tone="muted" numberOfLines={1}>
                      {detail}
                    </AppText>
                  )}
                </View>
                {selected && <Icon name="check" size={20} color={c.accent} />}
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Font.serif,
    fontSize: 30,
    lineHeight: 34,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.md,
  },
  names: {
    flex: 1,
    minWidth: 0,
  },
});
