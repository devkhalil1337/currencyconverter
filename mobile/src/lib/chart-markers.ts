import type { RateAlert } from './alerts';

export interface ChartMarker {
  value: number;
  label: string;
}

export interface PlacedMarker extends ChartMarker {
  /** Where a marker too far from the data is pinned instead of drawn as a line; null draws the line. */
  edge: 'top' | 'bottom' | null;
}

export interface ChartDomain {
  min: number;
  max: number;
  markers: PlacedMarker[];
}

// A marker may stretch the y-axis by this share of the data's range; further ones would flatten the line.
const STRETCH = 0.15;

/** The y-axis range for `values`, widened just enough for nearby markers. */
export function chartDomain(values: number[], markers: ChartMarker[] = []): ChartDomain {
  if (values.length === 0) return { min: 0, max: 0, markers: [] };
  const low = Math.min(...values);
  const high = Math.max(...values);
  const allowance = (high - low) * STRETCH;
  let min = low;
  let max = high;
  const placed: PlacedMarker[] = [];
  for (const m of markers) {
    if (!Number.isFinite(m.value)) continue;
    if (m.value > high + allowance) {
      placed.push({ ...m, edge: 'top' });
    } else if (m.value < low - allowance) {
      placed.push({ ...m, edge: 'bottom' });
    } else {
      placed.push({ ...m, edge: null });
      min = Math.min(min, m.value);
      max = Math.max(max, m.value);
    }
  }
  return { min, max, markers: placed };
}

/**
 * Targets of the still-watching alerts on this pair, in `from`→`to` terms: an alert set on the
 * inverse pair (USD→EUR while the chart shows EUR→USD) is flipped to 1/target.
 */
export function alertTargets(
  alerts: Pick<RateAlert, 'from' | 'to' | 'target' | 'triggeredAt'>[],
  from: string,
  to: string
): number[] {
  const targets = new Set<number>();
  for (const a of alerts) {
    if (a.triggeredAt !== null || !(a.target > 0)) continue;
    if (a.from === from && a.to === to) targets.add(a.target);
    else if (a.from === to && a.to === from) targets.add(1 / a.target);
  }
  return [...targets];
}
