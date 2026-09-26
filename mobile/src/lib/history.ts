export type Range = '1W' | '1M' | '1Y' | '5Y';

export interface Point {
  date: string;
  value: number;
}

export interface History {
  points: Point[];
  source: 'ecb' | 'exchange-api';
}

const RANGE_DAYS: Record<Range, number> = { '1W': 7, '1M': 30, '1Y': 365, '5Y': 5 * 365 };

// Currencies published by the ECB, served by Frankfurter as one time-series request.
export const ECB = new Set([
  'aud', 'brl', 'cad', 'chf', 'cny', 'czk', 'dkk', 'eur', 'gbp', 'hkd', 'huf', 'idr', 'ils', 'inr', 'isk',
  'jpy', 'krw', 'mxn', 'myr', 'nok', 'nzd', 'php', 'pln', 'ron', 'sek', 'sgd', 'thb', 'try', 'usd', 'zar',
]);

// Dated snapshots of fawazahmed0/exchange-api start here.
export const EXCHANGE_API_START = '2024-03-02';
const MAX_POINTS = 120;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

function downsample(points: Point[]): Point[] {
  if (points.length <= MAX_POINTS) return points;
  const step = (points.length - 1) / (MAX_POINTS - 1);
  return Array.from({ length: MAX_POINTS }, (_, i) => points[Math.round(i * step)]);
}

async function fromFrankfurter(from: string, to: string, range: Range): Promise<Point[]> {
  const start = isoDate(daysAgo(RANGE_DAYS[range]));
  const url = `https://api.frankfurter.dev/v1/${start}..?base=${from.toUpperCase()}&symbols=${to.toUpperCase()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { rates: Record<string, Record<string, number>> };
  const key = to.toUpperCase();
  return Object.entries(data.rates)
    .map(([date, r]) => ({ date, value: r[key] }))
    .filter((p) => typeof p.value === 'number')
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function snapshot(date: string, from: string, to: string): Promise<Point | null> {
  const urls = [
    `https://${date}.currency-api.pages.dev/v1/currencies/${from}.min.json`,
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${from}.min.json`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = (await res.json()) as Record<string, Record<string, number>>;
      const value = data[from]?.[to];
      if (typeof value === 'number') return { date, value };
    } catch {
      // try the mirror
    }
  }
  return null;
}

/** Samples daily snapshots, since exchange-api has no time-series endpoint. */
async function fromExchangeApi(from: string, to: string, range: Range): Promise<Point[]> {
  const samples = { '1W': 8, '1M': 11, '1Y': 13, '5Y': 13 }[range];
  const days = RANGE_DAYS[range];
  const dates = new Set<string>();
  for (let i = samples - 1; i >= 0; i--) {
    const date = isoDate(daysAgo(Math.round((days * i) / (samples - 1))));
    if (date >= EXCHANGE_API_START) dates.add(date);
  }
  const results = await Promise.all([...dates].map((d) => snapshot(d, from, to)));
  return results.filter((p): p is Point => p !== null);
}

const cache = new Map<string, Promise<History>>();

export function historyKey(from: string, to: string, range: Range): string {
  return `${from}:${to}:${range}:${isoDate(new Date())}`;
}

export function fetchHistory(from: string, to: string, range: Range): Promise<History> {
  const key = historyKey(from, to, range);
  const cached = cache.get(key);
  if (cached) return cached;

  const useEcb = ECB.has(from) && ECB.has(to);
  const promise = (useEcb ? fromFrankfurter(from, to, range) : fromExchangeApi(from, to, range)).then(
    (points): History => {
      if (points.length < 2) throw new Error('Not enough history for this pair');
      return { points: downsample(points), source: useEcb ? 'ecb' : 'exchange-api' };
    }
  );
  cache.set(key, promise);
  promise.catch(() => cache.delete(key));
  return promise;
}
