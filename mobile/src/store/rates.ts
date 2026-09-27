import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Rates } from '@/lib/convert';
import { fetchCurrencyNames, fetchUsdRates } from '@/lib/rates-api';

import { persistStorage } from './storage';

const FRESH_MS = 30 * 60 * 1000;

type Status = 'idle' | 'loading' | 'error';

interface RatesState {
  rates: Rates | null;
  names: Record<string, string>;
  /** Publication date of the rates, as reported by the API (YYYY-MM-DD). */
  date: string | null;
  fetchedAt: number | null;
  status: Status;
  refresh: (force?: boolean) => Promise<void>;
}

let inFlight: Promise<void> | null = null;

export const useRates = create<RatesState>()(
  persist(
    (set, get) => ({
      rates: null,
      names: {},
      date: null,
      fetchedAt: null,
      status: 'idle',
      refresh: (force = false) => {
        const { fetchedAt, rates } = get();
        if (!force && rates && fetchedAt && Date.now() - fetchedAt < FRESH_MS) {
          return Promise.resolve();
        }
        if (inFlight) return inFlight;

        set({ status: 'loading' });
        inFlight = (async () => {
          try {
            const needNames = force || Object.keys(get().names).length === 0;
            const [usd, names] = await Promise.all([
              fetchUsdRates(),
              needNames ? fetchCurrencyNames() : Promise.resolve(get().names),
            ]);
            set({
              rates: usd.rates,
              date: usd.date,
              names,
              fetchedAt: Date.now(),
              status: 'idle',
            });
          } catch (err) {
            console.warn('Rates refresh failed', err);
            // Keep the last good rates; the UI shows them as offline.
            set({ status: 'error' });
          } finally {
            inFlight = null;
          }
        })();
        return inFlight;
      },
    }),
    {
      name: 'trippence-rates',
      storage: persistStorage,
      partialize: ({ rates, names, date, fetchedAt }) => ({ rates, names, date, fetchedAt }),
    }
  )
);

/** Codes we can both name and convert, popular ones first. */
export const POPULAR = ['usd', 'eur', 'gbp', 'jpy', 'cad', 'aud', 'chf', 'cny', 'inr', 'mxn', 'aed', 'btc', 'eth'];

export function currencyName(code: string, names: Record<string, string>): string {
  const name = names[code];
  return name && name.trim() ? name : code.toUpperCase();
}
