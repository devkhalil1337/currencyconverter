import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'convert'
  | 'chart'
  | 'suitcase'
  | 'sliders'
  | 'backspace'
  | 'card'
  | 'plus'
  | 'search'
  | 'close'
  | 'check'
  | 'chevron'
  | 'refresh'
  | 'shield'
  | 'bell'
  | 'food'
  | 'transport'
  | 'stay'
  | 'shopping'
  | 'activity'
  | 'other'
  | 'camera'
  | 'trash'
  | 'minus'
  | 'calendar'
  | 'share'
  | 'image'
  | 'globe'
  | 'receipt';

interface IconProps {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

/** Stroke icons shared with the mockups; drawn with SVG so they match on every platform. */
export function Icon({ name, size = 20, color, strokeWidth = 2 }: IconProps) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'convert' && (
        <>
          <Path d="M4 8h15" {...common} />
          <Path d="M15 4l4 4-4 4" {...common} />
          <Path d="M20 16H5" {...common} />
          <Path d="M9 12l-4 4 4 4" {...common} />
        </>
      )}
      {name === 'chart' && (
        <>
          <Path d="M3 17l6-6 4 4 8-8" {...common} />
          <Path d="M15 7h6v6" {...common} />
        </>
      )}
      {name === 'suitcase' && (
        <>
          <Rect x={3} y={7} width={18} height={13} rx={2.5} {...common} />
          <Path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" {...common} />
          <Path d="M3 13h18" {...common} />
        </>
      )}
      {name === 'sliders' && (
        <>
          <Path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" {...common} />
          <Circle cx={16} cy={6} r={2} {...common} />
          <Circle cx={10} cy={12} r={2} {...common} />
          <Circle cx={18} cy={18} r={2} {...common} />
        </>
      )}
      {name === 'backspace' && (
        <>
          <Path d="M21 5H9l-6 7 6 7h12z" {...common} />
          <Path d="M13 9l6 6M19 9l-6 6" {...common} />
        </>
      )}
      {name === 'card' && (
        <>
          <Rect x={3} y={6} width={18} height={13} rx={2} {...common} />
          <Path d="M3 10h18M7 15h3" {...common} />
        </>
      )}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...common} />}
      {name === 'minus' && <Path d="M5 12h14" {...common} />}
      {name === 'search' && (
        <>
          <Circle cx={11} cy={11} r={7} {...common} />
          <Path d="M20 20l-3.5-3.5" {...common} />
        </>
      )}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...common} />}
      {name === 'check' && <Path d="M5 12l5 5 9-10" {...common} />}
      {name === 'chevron' && <Path d="M9 6l6 6-6 6" {...common} />}
      {name === 'refresh' && (
        <>
          <Path d="M20 11a8 8 0 0 0-14.9-4" {...common} />
          <Path d="M4 4v4h4" {...common} />
          <Path d="M4 13a8 8 0 0 0 14.9 4" {...common} />
          <Path d="M20 20v-4h-4" {...common} />
        </>
      )}
      {name === 'food' && (
        <>
          <Path d="M7 3v18" {...common} />
          <Path d="M4 3v5a3 3 0 0 0 6 0V3" {...common} />
          <Path d="M18 21V3c-2 0-4 2-4 6s2 5 4 5" {...common} />
        </>
      )}
      {name === 'transport' && (
        <>
          <Rect x={6} y={3} width={12} height={14} rx={3} {...common} />
          <Path d="M6 11h12M9 21l1-4M15 21l-1-4" {...common} />
        </>
      )}
      {name === 'stay' && (
        <>
          <Path d="M3 18V6M21 18v-6a3 3 0 0 0-3-3h-7v6" {...common} />
          <Path d="M3 15h18" {...common} />
          <Circle cx={7} cy={11} r={2} {...common} />
        </>
      )}
      {name === 'shopping' && (
        <>
          <Path d="M5 8h14l-1 12H6z" {...common} />
          <Path d="M9 8V6a3 3 0 0 1 6 0v2" {...common} />
        </>
      )}
      {name === 'activity' && (
        <>
          <Path d="M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 0 0-4V4H4z" {...common} />
          <Path d="M14 4v12" {...common} />
        </>
      )}
      {name === 'other' && (
        <>
          <Circle cx={6} cy={12} r={1.2} {...common} />
          <Circle cx={12} cy={12} r={1.2} {...common} />
          <Circle cx={18} cy={12} r={1.2} {...common} />
        </>
      )}
      {name === 'camera' && (
        <>
          <Path d="M4 8h3l2-3h6l2 3h3v11H4z" {...common} />
          <Circle cx={12} cy={13} r={3.5} {...common} />
        </>
      )}
      {name === 'trash' && (
        <>
          <Path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" {...common} />
        </>
      )}
      {name === 'bell' && (
        <>
          <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" {...common} />
          <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" {...common} />
        </>
      )}
      {name === 'shield' && (
        <>
          <Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" {...common} />
          <Path d="M9 12l2 2 4-4" {...common} />
        </>
      )}
      {name === 'calendar' && (
        <>
          <Rect x={3} y={5} width={18} height={16} rx={2.5} {...common} />
          <Path d="M3 10h18M8 3v4M16 3v4" {...common} />
        </>
      )}
      {name === 'share' && (
        <>
          <Path d="M12 15V3M8 7l4-4 4 4" {...common} />
          <Path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" {...common} />
        </>
      )}
      {name === 'image' && (
        <>
          <Rect x={3} y={4} width={18} height={16} rx={2.5} {...common} />
          <Circle cx={9} cy={10} r={1.8} {...common} />
          <Path d="M21 16l-5-5-9 9" {...common} />
        </>
      )}
      {name === 'globe' && (
        <>
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" {...common} />
        </>
      )}
      {name === 'receipt' && (
        <>
          <Path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" {...common} />
          <Path d="M9 8h6M9 12h6M9 16h3" {...common} />
        </>
      )}
    </Svg>
  );
}
