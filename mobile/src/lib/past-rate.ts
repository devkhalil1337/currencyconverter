import { ECB, EXCHANGE_API_START } from './history';

export type RateSource = 'ecb' | 'exchange-api';

export interface PastRate {
  /** Units of `to` for 1 `from`. */
  rate: number;
  /** Date the rate is from; earlier than the one asked for on weekends and holidays. */
  date: string;
  source: RateSource;
}

/** "network" is worth retrying; "no-data" means nothing was published for that date. */
export type PastRateErrorKind = 'network' | 'no-data';

// First ECB reference rates, published when the euro launched.
export const ECB_START = '1999-01-04';

// Snapshots are daily, but the newest one can lag behind the local calendar.
const SNAPSHOT_LOOKBACK_DAYS = 2;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function failure(kind: PastRateErrorKind, message: string): Error {
  return Object.assign(new Error(message), { kind });
}

export function pastRateErrorKind(err: unknown): PastRateErrorKind {
  const kind = (err as { kind?: unknown } | null)?.kind;
  return kind === 'no-data' ? 'no-data' : 'network';
}

export function isEcbPair(from: string, to: string): boolean {
  return ECB.has(from) && ECB.has(to);
}

/** Earliest date a rate can be looked up for this pair. */
export function minDateFor(from: string, to: string): string {
  return isEcbPair(from, to) ? ECB_START : EXCHANGE_API_START;
}

/** Rejects malformed and impossible dates like 2025-02-30, which Date would roll over. */
function isRealDate(iso: string): boolean {
  if (!ISO_DATE.test(iso)) return false;
  const time = Date.parse(`${iso}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === iso;
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function fromFrankfurter(from: string, to: string, date: string): Promise<PastRate> {
  const url = `https://api.frankfurter.dev/v1/${date}?base=${from.toUpperCase()}&symbols=${to.toUpperCase()}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw failure('network', 'Request failed');
  }
  // 404: no rate that far back for this currency; 422: pair not supported.
  if (res.status === 404 || res.status === 422) throw failure('no-data', `HTTP ${res.status}`);
  if (!res.ok) throw failure('network', `HTTP ${res.status}`);
  let data: { date?: unknown; rates?: Record<string, unknown> };
  try {
    data = await res.json();
  } catch {
    throw failure('network', 'Unreadable response');
  }
  const rate = data?.rates?.[to.toUpperCase()];
  if (typeof rate !== 'number' || !(rate > 0) || typeof data.date !== 'string' || !ISO_DATE.test(data.date)) {
    throw failure('no-data', 'No rate in response');
  }
  return { rate, date: data.date, source: 'ecb' };
}

type Snapshot = { rate: number; date: string } | 'missing' | 'unreachable';

async function snapshot(date: string, from: string, to: string): Promise<Snapshot> {
  const urls = [
    `https://${date}.currency-api.pages.dev/v1/currencies/${from}.min.json`,
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${from}.min.json`,
  ];
  let reached = false;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.status === 404) {
        reached = true;
        continue;
      }
      if (!res.ok) continue;
      const data = (await res.json()) as Record<string, unknown> & { date?: unknown };
      reached = true;
      const rate = (data[from] as Record<string, unknown> | undefined)?.[to];
      if (typeof rate === 'number' && rate > 0) {
        return { rate, date: typeof data.date === 'string' && ISO_DATE.test(data.date) ? data.date : date };
      }
    } catch {
      // try the mirror
    }
  }
  return reached ? 'missing' : 'unreachable';
}

async function fromExchangeApi(from: string, to: string, date: string): Promise<PastRate> {
  for (let back = 0; back <= SNAPSHOT_LOOKBACK_DAYS; back++) {
    const day = shiftDate(date, -back);
    if (day < EXCHANGE_API_START) break;
    const result = await snapshot(day, from, to);
    // Offline or both mirrors down: retrying beats quietly answering with an older day.
    if (result === 'unreachable') throw failure('network', 'Request failed');
    if (result !== 'missing') return { ...result, source: 'exchange-api' };
  }
  throw failure('no-data', 'No snapshot for this date');
}

const cache = new Map<string, Promise<PastRate>>();

/**
 * Rate for 1 `from` in `to` on `isoDate` (YYYY-MM-DD). ECB pairs use the ECB reference rate via
 * Frankfurter, which answers weekends and holidays with the previous business day; other pairs
 * use exchange-api's daily snapshots.
 */
export function fetchRateOn(from: string, to: string, isoDate: string): Promise<PastRate> {
  const ecb = isEcbPair(from, to);
  if (!isRealDate(isoDate) || isoDate < minDateFor(from, to)) {
    return Promise.reject(failure('no-data', 'Date out of range'));
  }
  if (from === to) return Promise.resolve({ rate: 1, date: isoDate, source: ecb ? 'ecb' : 'exchange-api' });

  const key = `${from}:${to}:${isoDate}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const promise = ecb ? fromFrankfurter(from, to, isoDate) : fromExchangeApi(from, to, isoDate);
  cache.set(key, promise);
  promise.catch(() => cache.delete(key));
  return promise;
}

export type DateNote = 'exact' | 'previous-business-day' | 'latest-published' | 'earlier-snapshot';

/** Explains how the date a rate is from relates to the one the user asked for. */
export function dateNote(requested: string, actual: string, source: RateSource, today: string): DateNote {
  if (actual >= requested) return 'exact';
  if (requested >= today) return 'latest-published';
  return source === 'ecb' ? 'previous-business-day' : 'earlier-snapshot';
}
