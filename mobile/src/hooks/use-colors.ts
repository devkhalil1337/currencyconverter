import { BadgeTones, Palette, type Colors } from '@/constants/theme';
import { usePrefs } from '@/store/prefs';

import { useColorScheme } from './use-color-scheme';

export function useIsDark(): boolean {
  const appearance = usePrefs((s) => s.appearance);
  const scheme = useColorScheme();
  return appearance === 'system' ? scheme === 'dark' : appearance === 'dark';
}

export function useColors(): Colors {
  return useIsDark() ? Palette.dark : Palette.light;
}

export function useBadgeTone(code: string): readonly [string, string] {
  const tones = useIsDark() ? BadgeTones.dark : BadgeTones.light;
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  return tones[hash % tones.length];
}
