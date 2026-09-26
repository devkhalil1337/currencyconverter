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
  | 'minus';

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
      {name === 'shield' && (
        <>
          <Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" {...common} />
          <Path d="M9 12l2 2 4-4" {...common} />
        </>
      )}
    </Svg>
  );
}
