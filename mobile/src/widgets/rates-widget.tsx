// Widgets render through react-native-android-widget, which needs plain function
// components; opt this file out of the React Compiler.
'use no memo';

import { FlexWidget, TextWidget } from 'react-native-android-widget';

export const RATES_WIDGET = 'Rates';

type Hex = `#${string}`;

interface Tone {
  bg: Hex;
  ink: Hex;
  muted: Hex;
  accent: Hex;
  line: Hex;
}

const LIGHT: Tone = { bg: '#F5F4EF', ink: '#15171C', muted: '#5B6068', accent: '#0F766E', line: '#E3E1DA' };
const DARK: Tone = { bg: '#171A1F', ink: '#F1F0EB', muted: '#9CA1A9', accent: '#5EEAD4', line: '#272B32' };

// Font files bundled by the config plugin; the family is the file name.
const SEMIBOLD = 'Geist_600SemiBold';
const REGULAR = 'Geist_400Regular';

export interface RatesWidgetProps {
  home: string;
  rows: { code: string; rate: string }[];
  /** "Updated 14:05", or a hint to open the app before rates have loaded. */
  status: string;
  /** Free users see an upsell instead of rates. */
  locked: boolean;
  /** Translated upsell copy; the widget renders headless, so text comes in ready-made. */
  lockedTitle: string;
  lockedCta: string;
}

function Body({ home, rows, status, locked, lockedTitle, lockedCta, t }: RatesWidgetProps & { t: Tone }) {
  if (locked) {
    return (
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: 'trippence://paywall?reason=widgets' }}
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: t.bg,
          borderRadius: 24,
          padding: 16,
          justifyContent: 'center',
        }}>
        <TextWidget text="Trippence" style={{ fontSize: 13, fontFamily: SEMIBOLD, color: t.accent }} />
        <TextWidget text={lockedTitle} style={{ fontSize: 17, fontFamily: SEMIBOLD, color: t.ink, marginTop: 4 }} />
        <TextWidget text={lockedCta} style={{ fontSize: 13, fontFamily: REGULAR, color: t.muted, marginTop: 4 }} />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: t.bg,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        justifyContent: 'space-between',
      }}>
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', width: 'match_parent' }}>
        <TextWidget text={`1 ${home.toUpperCase()}`} style={{ fontSize: 15, fontFamily: SEMIBOLD, color: t.ink }} />
        <TextWidget text={status} style={{ fontSize: 11, fontFamily: REGULAR, color: t.muted }} />
      </FlexWidget>
      {rows.map((row) => (
        <FlexWidget
          key={row.code}
          style={{ flexDirection: 'row', justifyContent: 'space-between', width: 'match_parent', alignItems: 'center' }}>
          <TextWidget text={row.code.toUpperCase()} style={{ fontSize: 14, fontFamily: SEMIBOLD, color: t.accent }} />
          <TextWidget text={row.rate} style={{ fontSize: 17, fontFamily: SEMIBOLD, color: t.ink }} />
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}

/** Light and dark variants; the launcher picks one to match the system theme. */
export function ratesWidget(props: RatesWidgetProps) {
  return {
    light: <Body {...props} t={LIGHT} />,
    dark: <Body {...props} t={DARK} />,
  };
}
