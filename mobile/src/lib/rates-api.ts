import type { Rates } from './convert';

// Free, key-less daily rates (fawazahmed0/exchange-api). The jsDelivr mirror
// is the documented fallback when the Cloudflare host is unavailable.
const HOSTS = [
  'https://latest.currency-api.pages.dev/v1',
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1',
];

async function getJson<T>(path: string): Promise<T> {
  let lastError: unknown;
  for (const host of HOSTS) {
    try {
      const res = await fetch(`${host}/${path}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Network request failed');
}

export async function fetchUsdRates(): Promise<{ date: string; rates: Rates }> {
  const data = await getJson<{ date: string; usd: Rates }>('currencies/usd.json');
  if (!data?.usd || typeof data.usd !== 'object') {
    throw new Error('Unexpected rates response');
  }
  return { date: data.date, rates: data.usd };
}

export async function fetchCurrencyNames(): Promise<Record<string, string>> {
  return getJson<Record<string, string>>('currencies.json');
}
