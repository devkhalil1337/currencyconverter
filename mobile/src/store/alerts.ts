import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Direction, RateAlert } from '@/lib/alerts';

import { persistStorage } from './storage';

export const MAX_ALERTS = 20;

interface AlertsState {
  alerts: RateAlert[];
  add: (alert: { from: string; to: string; direction: Direction; target: number }) => void;
  remove: (id: string) => void;
  rearm: (id: string) => void;
  markTriggered: (ids: string[], at: number) => void;
}

export const useAlerts = create<AlertsState>()(
  persist(
    (set) => ({
      alerts: [],
      add: ({ from, to, direction, target }) =>
        set((s) => ({
          alerts: [
            {
              id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
              from,
              to,
              direction,
              target,
              createdAt: Date.now(),
              triggeredAt: null,
            },
            ...s.alerts,
          ].slice(0, MAX_ALERTS),
        })),
      remove: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
      rearm: (id) =>
        set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, triggeredAt: null } : a)) })),
      markTriggered: (ids, at) =>
        set((s) => ({ alerts: s.alerts.map((a) => (ids.includes(a.id) ? { ...a, triggeredAt: at } : a)) })),
    }),
    {
      name: 'trippence-alerts',
      storage: persistStorage,
    }
  )
);

export function activeAlertCount(alerts: RateAlert[]): number {
  return alerts.filter((a) => a.triggeredAt === null).length;
}
