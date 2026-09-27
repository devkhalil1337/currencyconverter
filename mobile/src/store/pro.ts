import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage } from './storage';

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
  setPro: (isPro: boolean) => void;
  setDevPro: (devPro: boolean) => void;
}

export const usePro = create<ProState>()(
  persist(
    (set) => ({
      isPro: false,
      devPro: false,
      setPro: (isPro) => set({ isPro }),
      setDevPro: (devPro) => set({ devPro }),
    }),
    {
      name: 'fairrate-pro',
      storage: persistStorage,
    }
  )
);

export function useIsPro(): boolean {
  return usePro((s) => s.isPro || (TEST_TOOLS && s.devPro));
}
