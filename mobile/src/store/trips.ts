import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Expense, Trip } from '@/lib/trips';

import { persistStorage } from './storage';

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

interface TripsState {
  trips: Trip[];
  expenses: Expense[];
  addTrip: (trip: Omit<Trip, 'id' | 'createdAt'>) => string;
  updateTrip: (id: string, changes: Partial<Omit<Trip, 'id' | 'createdAt'>>) => void;
  deleteTrip: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
}

export const useTrips = create<TripsState>()(
  persist(
    (set) => ({
      trips: [],
      expenses: [],
      addTrip: (trip) => {
        const id = newId();
        set((s) => ({ trips: [{ ...trip, id, createdAt: Date.now() }, ...s.trips] }));
        return id;
      },
      updateTrip: (id, changes) =>
        set((s) => ({ trips: s.trips.map((t) => (t.id === id ? { ...t, ...changes } : t)) })),
      deleteTrip: (id) =>
        set((s) => ({
          trips: s.trips.filter((t) => t.id !== id),
          expenses: s.expenses.filter((e) => e.tripId !== id),
        })),
      addExpense: (expense) =>
        set((s) => ({ expenses: [{ ...expense, id: newId(), createdAt: Date.now() }, ...s.expenses] })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
    }),
    {
      name: 'fairrate-trips',
      storage: persistStorage,
    }
  )
);
