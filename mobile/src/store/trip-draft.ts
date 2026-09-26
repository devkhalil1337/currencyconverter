import { create } from 'zustand';

/** Hands a currency chosen in the picker back to the new-trip form. */
export const useTripDraft = create<{ currency: string | null; setCurrency: (code: string | null) => void }>()(
  (set) => ({
    currency: null,
    setCurrency: (currency) => set({ currency }),
  })
);
