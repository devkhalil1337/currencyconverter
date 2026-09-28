import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { storeKey } from '@/lib/store-key';

import { persistStorage } from './storage';

/**
 * A build without a store key has nothing to sell, so it opens every feature instead of
 * locking them behind a paywall nobody can pass. Adding the key turns Pro back on.
 */
export const FREE_LAUNCH = storeKey() === null;

/** Debug builds and test builds (EXPO_PUBLIC_TEST_TOOLS=1) get the Developer tools, incl. Pretend Pro. */
export const TEST_TOOLS = __DEV__ || process.env.EXPO_PUBLIC_TEST_TOOLS === '1';

/** Free-plan limits; Pro removes them. */
export const FREE_LIMITS = {
  activeAlerts: 2,
  trips: 1,
} as const;

interface ProState {
  /** Last entitlement state from RevenueCat, cached so the app knows offline. */
  isPro: boolean;
  /** Debug-only override for testing gated features without a purchase. */
  devPro: boolean;
  /** Used the app while everything was free; lets a later version treat early users kindly. */
  earlyUser: boolean;
  setPro: (isPro: boolean) => void;
  setDevPro: (devPro: boolean) => void;
  markEarlyUser: () => void;
}

export const usePro = create<ProState>()(
  persist(
    (set) => ({
      isPro: false,
      devPro: false,
      earlyUser: false,
      setPro: (isPro) => set({ isPro }),
      setDevPro: (devPro) => set({ devPro }),
      markEarlyUser: () => set({ earlyUser: true }),
    }),
    {
      name: 'trippence-pro',
      storage: persistStorage,
    }
  )
);

function unlocked(s: Pick<ProState, 'isPro' | 'devPro'>): boolean {
  return FREE_LAUNCH || s.isPro || (TEST_TOOLS && s.devPro);
}

export function useIsPro(): boolean {
  return usePro(unlocked);
}

/** For code outside React, such as the headless widget task. */
export function isProNow(): boolean {
  return unlocked(usePro.getState());
}
