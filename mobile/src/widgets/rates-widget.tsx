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
  updated: string | null;
  /** Free users see an upsell instead of rates. */
  locked: boolean;
}

function Body({ home, rows, updated, locked, t }: RatesWidgetProps & { t: Tone }) {
  if (locked) {
    return (
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: 'fairrate://paywall?reason=widgets' }}
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: t.bg,
          borderRadius: 24,
          padding: 16,
          justifyContent: 'center',
        }}>
        <TextWidget text="Fairrate" style={{ fontSize: 13, fontFamily: SEMIBOLD, color: t.accent }} />
        <TextWidget
          text="Live rates on your home screen"
          style={{ fontSize: 17, fontFamily: SEMIBOLD, color: t.ink, marginTop: 4 }}
        />
        <TextWidget text="Tap to unlock with Pro" style={{ fontSize: 13, fontFamily: REGULAR, color: t.muted, marginTop: 4 }} />
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
        <TextWidget
          text={updated ? `Updated ${updated}` : 'Open to load rates'}
          style={{ fontSize: 11, fontFamily: REGULAR, color: t.muted }}
        />
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
