import { t } from '@/i18n';

import { decimalsFor } from './convert';
import type { Point } from './history';
import { categoryLabel, methodLabel, toIsoDate, type Expense, type Trip } from './trips';

/** Strings are text cells; numbers are written as machine-readable numbers. */
export type CsvCell = string | number | null | undefined;

// Lets Excel detect UTF-8, so accents and currency symbols survive.
const BOM = '﻿';
// Spreadsheet apps treat text starting with these as a formula.
const FORMULA_START = /^[=+\-@\t\r]/;

/** Plain decimal notation with "." and no grouping or exponent, e.g. 1e-7 → "0.0000001". */
export function formatCsvNumber(value: number): string {
  if (!Number.isFinite(value)) return '';
  if (Object.is(value, -0)) return '0';
  const text = String(value);
  const e = text.indexOf('e');
  if (e === -1) return text;

  const negative = text.startsWith('-');
  const mantissa = text.slice(negative ? 1 : 0, e);
  const exponent = parseInt(text.slice(e + 1), 10);
  const [whole, fraction = ''] = mantissa.split('.');
  const digits = whole + fraction;
  const point = whole.length + exponent;
  const plain =
    point <= 0
      ? `0.${'0'.repeat(-point)}${digits}`
      : point >= digits.length
        ? digits + '0'.repeat(point - digits.length)
        : `${digits.slice(0, point)}.${digits.slice(point)}`;
  return negative ? `-${plain}` : plain;
}

export function csvCell(value: CsvCell): string {
  if (value === null || value === undefined) return '';
  let text: string;
  if (typeof value === 'number') {
    text = formatCsvNumber(value);
  } else {
    text = FORMULA_START.test(value) ? `'${value}` : value;
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** RFC 4180 CSV with CRLF line endings and a UTF-8 BOM. */
export function toCsv(rows: CsvCell[][]): string {
  return BOM + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

function roundFor(value: number, code: string): number {
  return Number(value.toFixed(decimalsFor(value, code)));
}

function localTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Column headers in the app's language; the cells below stay machine-readable. */
export function tripCsvHeader(): string[] {
  return [
    t('csv.date'),
    t('csv.time'),
    t('csv.title'),
    t('csv.category'),
    t('csv.payment'),
    t('csv.amount'),
    t('csv.currency'),
    t('csv.amountHome'),
    t('csv.homeCurrency'),
  ];
}

/** A trip's expenses, oldest first, with a totals row. Dates and times are local. */
export function tripCsv(trip: Trip, expenses: Expense[]): string {
  const own = expenses.filter((e) => e.tripId === trip.id).sort((a, b) => a.createdAt - b.createdAt);
  const currency = trip.currency.toUpperCase();
  const home = trip.homeCurrency.toUpperCase();
  const rows: CsvCell[][] = [tripCsvHeader()];
  let total = 0;
  let totalHome = 0;
  let hasHome = false;
  for (const e of own) {
    const created = new Date(e.createdAt);
    const amount = roundFor(e.amount, trip.currency);
    const homeAmount = e.homeAmount === null ? null : roundFor(e.homeAmount, trip.homeCurrency);
    // Totals add up the rounded values so they match the rows above them.
    total += amount;
    if (homeAmount !== null) {
      totalHome += homeAmount;
      hasHome = true;
    }
    rows.push([
      toIsoDate(created),
      localTime(created),
      e.title,
      categoryLabel(e.category),
      methodLabel(e.method),
      amount,
      currency,
      homeAmount,
      homeAmount === null ? null : home,
    ]);
  }
  rows.push([
    t('csv.total'),
    null,
    null,
    null,
    null,
    roundFor(total, trip.currency),
    currency,
    hasHome ? roundFor(totalHome, trip.homeCurrency) : null,
    hasHome ? home : null,
  ]);
  return toCsv(rows);
}

export function seriesCsv(points: Point[], from: string, to: string): string {
  const pair = `${from.toUpperCase()}/${to.toUpperCase()}`;
  return toCsv([[t('csv.date'), t('csv.rate'), t('csv.pair')], ...points.map((p) => [p.date, p.value, pair])]);
}

/** Lowercase ASCII words joined by dashes, e.g. "São Paulo & Rio!" → "sao-paulo-rio". */
export function slugify(text: string, maxLength = 40): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, maxLength)
    .replace(/^-+|-+$/g, '');
}

/** e.g. trippence-lisbon-2026-09-26.csv; `fallback` stands in when nothing survives slugifying. */
export function exportFileName(parts: string[], date: string, fallback = 'export'): string {
  const slug = slugify(parts.join(' ')) || fallback;
  return `trippence-${slug}-${date}.csv`;
}
