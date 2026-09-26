export type Category = 'food' | 'transport' | 'stay' | 'shopping' | 'activity' | 'other';
export type PaymentMethod = 'card' | 'cash';

export interface Trip {
  id: string;
  name: string;
  /** Currency prices are paid in, e.g. "eur". */
  currency: string;
  /** Currency the totals are shown in; the home currency when the trip was created. */
  homeCurrency: string;
  /** Local calendar dates, YYYY-MM-DD, inclusive. */
  startDate: string;
  endDate: string;
  /** Optional budget in the trip currency. */
  budget: number | null;
  createdAt: number;
}

export interface Expense {
  id: string;
  tripId: string;
  title: string;
  category: Category;
  method: PaymentMethod;
  /** Amount in the trip currency. */
  amount: number;
  /**
   * Cost in the home currency, fixed when the expense was added (card fee included
   * for card payments), so later rate moves don't rewrite past spending.
   */
  homeAmount: number | null;
  createdAt: number;
}

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'stay', label: 'Stay' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'activity', label: 'Activities' },
  { value: 'other', label: 'Other' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD for a local date. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

/** Number of calendar days in the trip, counting both ends. */
export function tripLength(trip: Pick<Trip, 'startDate' | 'endDate'>): number {
  const diff = Math.round((parseIsoDate(trip.endDate).getTime() - parseIsoDate(trip.startDate).getTime()) / DAY_MS);
  return Math.max(1, diff + 1);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseIsoDate(to).getTime() - parseIsoDate(from).getTime()) / DAY_MS);
}

export type TripPhase = 'upcoming' | 'active' | 'past';

export function tripPhase(trip: Pick<Trip, 'startDate' | 'endDate'>, today: string): TripPhase {
  if (today < trip.startDate) return 'upcoming';
  if (today > trip.endDate) return 'past';
  return 'active';
}

/** 1-based day of the trip for `today`, clamped to the trip length. */
export function dayOfTrip(trip: Pick<Trip, 'startDate' | 'endDate'>, today: string): number {
  const diff = Math.round((parseIsoDate(today).getTime() - parseIsoDate(trip.startDate).getTime()) / DAY_MS);
  return Math.min(tripLength(trip), Math.max(1, diff + 1));
}

export interface TripSummary {
  spent: number;
  spentHome: number;
  /** Share of the budget spent, 0..1+, or null without a budget. */
  budgetUsed: number | null;
  remaining: number | null;
  /** Budget left per remaining day (today included), or null. */
  perDayLeft: number | null;
}

export function summarize(trip: Trip, expenses: Expense[], today: string): TripSummary {
  const own = expenses.filter((e) => e.tripId === trip.id);
  const spent = own.reduce((sum, e) => sum + e.amount, 0);
  const spentHome = own.reduce((sum, e) => sum + (e.homeAmount ?? 0), 0);
  if (trip.budget === null || trip.budget <= 0) {
    return { spent, spentHome, budgetUsed: null, remaining: null, perDayLeft: null };
  }
  const remaining = trip.budget - spent;
  const phase = tripPhase(trip, today);
  const daysLeft =
    phase === 'past' ? 0 : phase === 'upcoming' ? tripLength(trip) : tripLength(trip) - dayOfTrip(trip, today) + 1;
  return {
    spent,
    spentHome,
    budgetUsed: spent / trip.budget,
    remaining,
    perDayLeft: daysLeft > 0 ? Math.max(0, remaining) / daysLeft : null,
  };
}

/** The trip to feature: the active one, else the next upcoming, else null. */
export function currentTrip(trips: Trip[], today: string): Trip | null {
  const active = trips.filter((t) => tripPhase(t, today) === 'active');
  if (active.length) return active.sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
  const upcoming = trips.filter((t) => tripPhase(t, today) === 'upcoming');
  return upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
}

export function formatDateRange(trip: Pick<Trip, 'startDate' | 'endDate'>): string {
  const start = parseIsoDate(trip.startDate);
  const end = parseIsoDate(trip.endDate);
  const sameYear = start.getFullYear() === end.getFullYear();
  const fmt = (d: Date, withYear: boolean) =>
    d.toLocaleDateString([], { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
  return `${fmt(start, !sameYear)} – ${fmt(end, true)}`;
}
