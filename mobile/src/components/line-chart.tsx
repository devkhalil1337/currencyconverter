import { useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import type { Point } from '@/lib/history';

interface LineChartProps {
  points: Point[];
  color: string;
  lineColor: string;
  height?: number;
  /** Called with the scrubbed point, or null when the finger lifts. */
  onScrub?: (point: Point | null) => void;
}

const PAD_Y = 10;
const PAD_X = 7;

export function LineChart({ points, color, lineColor, height = 170, onScrub }: LineChartProps) {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // A flat series (e.g. a pegged currency) draws through the middle.
  const span = max - min || 1;
  const flatOffset = max === min ? 0.5 : 0;
  const x = (i: number) =>
    points.length === 1 ? width / 2 : PAD_X + (i / (points.length - 1)) * (width - PAD_X * 2);
  const y = (v: number) => PAD_Y + (1 - (v - min) / span - flatOffset) * (height - PAD_Y * 2);

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1)} ${height} L${x(0)} ${height} Z`;

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
          ? `Chart from ${points[0].date} to ${points[last].date}, low ${min}, high ${max}`
          : 'Chart'
      }>
      {width > 0 && points.length > 1 && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.18} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={area} fill="url(#fill)" />
          <Path d={line} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
          {active !== null && (
            <Line x1={x(active)} x2={x(active)} y1={0} y2={height} stroke={lineColor} strokeWidth={1} />
          )}
          <Circle cx={x(dot)} cy={y(points[dot].value)} r={5} fill={color} stroke={lineColor} strokeWidth={2} />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
