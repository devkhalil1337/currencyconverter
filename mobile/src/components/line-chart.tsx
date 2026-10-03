import { useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { Font, Radius } from '@/constants/theme';
import { useT } from '@/i18n';
import { chartDomain, type ChartMarker, type PlacedMarker } from '@/lib/chart-markers';
import type { Point } from '@/lib/history';

import { AppText } from './app-text';

interface LineChartProps {
  points: Point[];
  color: string;
  lineColor: string;
  height?: number;
  /** Reference values, e.g. alert targets, drawn as dashed lines. */
  markers?: ChartMarker[];
  /** Called with the scrubbed point, or null when the finger lifts. */
  onScrub?: (point: Point | null) => void;
}

const PAD_Y = 10;
const PAD_X = 7;
const TAG_HEIGHT = 18;

export function LineChart({ points, color, lineColor, height = 170, markers, onScrub }: LineChartProps) {
  const t = useT();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  const values = points.map((p) => p.value);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const domain = chartDomain(values, markers);
  const { min, max } = domain;
  // A flat series (e.g. a pegged currency) draws through the middle.
  const span = max - min || 1;
  const flatOffset = max === min ? 0.5 : 0;
  const x = (i: number) =>
    points.length === 1 ? width / 2 : PAD_X + (i / (points.length - 1)) * (width - PAD_X * 2);
  const y = (v: number) => PAD_Y + (1 - (v - min) / span - flatOffset) * (height - PAD_Y * 2);

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1)} ${height} L${x(0)} ${height} Z`;

  const lines = domain.markers.filter((m) => m.edge === null);
  const above = domain.markers.filter((m) => m.edge === 'top');
  const below = domain.markers.filter((m) => m.edge === 'bottom');

  const scrubAt = (e: GestureResponderEvent) => {
    if (!width || points.length < 2) return;
    const ratio = Math.min(1, Math.max(0, (e.nativeEvent.locationX - PAD_X) / (width - PAD_X * 2)));
    const i = Math.round(ratio * (points.length - 1));
    setActive(i);
    onScrub?.(points[i]);
  };
  const release = () => {
    setActive(null);
    onScrub?.(null);
  };

  const last = points.length - 1;
  const dot = active ?? last;

  const tag = (m: PlacedMarker, key: string, arrow = '') => (
    <View key={key} style={[styles.tag, { backgroundColor: lineColor }]}>
      <AppText variant="caption" style={[styles.tagText, { color }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
        {arrow}
        {m.label}
      </AppText>
    </View>
  );

  return (
    <View
      style={[styles.container, { height }]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={scrubAt}
      onResponderMove={scrubAt}
      onResponderRelease={release}
      onResponderTerminate={release}
      accessibilityRole="image"
      accessibilityLabel={
        points.length > 1
          ? `${t('chart.label', { start: points[0].date, end: points[last].date, low, high })}${domain.markers
              .map((m) => `, ${m.label}`)
              .join('')}`
          : t('chart.empty')
      }>
      {width > 0 && points.length > 1 && (
        <>
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.18} />
                <Stop offset="1" stopColor={color} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Path d={area} fill="url(#fill)" />
            {lines.map((m, i) => (
              <Line
                key={i}
                x1={0}
                x2={width}
                y1={y(m.value)}
                y2={y(m.value)}
                stroke={color}
                strokeWidth={1.2}
                strokeDasharray={[5, 4]}
              />
            ))}
            <Path d={line} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
            {active !== null && (
              <Line x1={x(active)} x2={x(active)} y1={0} y2={height} stroke={lineColor} strokeWidth={1} />
            )}
            <Circle cx={x(dot)} cy={y(points[dot].value)} r={5} fill={color} stroke={lineColor} strokeWidth={2} />
          </Svg>

          {/* Labels sit on the left, away from the current-rate dot, and never take the touch. */}
          <View style={styles.overlay}>
            {lines.map((m, i) => {
              const at = y(m.value);
              const top = at - TAG_HEIGHT - 2 >= 0 ? at - TAG_HEIGHT - 2 : at + 3;
              return (
                <View key={i} style={[styles.lineTag, { top }]}>
                  {tag(m, 'tag')}
                </View>
              );
            })}
            {above.length > 0 && (
              <View style={[styles.edge, { top: 0 }]}>{above.map((m, i) => tag(m, `a${i}`, '↑ '))}</View>
            )}
            {below.length > 0 && (
              <View style={[styles.edge, { bottom: 0 }]}>{below.map((m, i) => tag(m, `b${i}`, '↓ '))}</View>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    pointerEvents: 'none',
  },
  lineTag: {
    position: 'absolute',
    left: 0,
  },
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    minHeight: TAG_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: Radius.pill,
  },
  tagText: {
    fontFamily: Font.semibold,
  },
});
