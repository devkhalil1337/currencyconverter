/**
 * Reads a receipt's total, currency, merchant and date from OCR text lines.
 *
 * OCR output is messy: labels and amounts often come back as separate lines (or whole
 * columns), separators get mangled and receipts are full of numbers that aren't prices.
 * Each step is a best guess that would rather return null than a confident wrong answer.
 */

export interface ParsedReceipt {
  amount: number | null;
  /** Lowercase ISO code, e.g. "eur". */
  currency: string | null;
  merchant: string | null;
  /** YYYY-MM-DD. */
  date: string | null;
  /** HH:MM, 24-hour. */
  time: string | null;
}

export interface ParseReceiptOptions {
  /** The trip's currency; settles "$", "kr" and "¥", and hints at the number format. */
  tripCurrency?: string;
}

const ZERO_DECIMAL = new Set(['jpy', 'krw', 'vnd', 'clp', 'isk', 'huf', 'idr', 'pyg', 'ugx', 'xaf', 'xof', 'twd', 'cop']);
const THREE_DECIMAL = new Set(['kwd', 'bhd', 'omr', 'jod', 'tnd', 'lyd', 'iqd']);

// Currencies that share a symbol; which one is meant comes from the rest of the receipt or the trip.
const FAMILIES: Record<string, { codes: Set<string>; fallback: string | null }> = {
  $: { codes: new Set(['usd', 'cad', 'aud', 'nzd', 'hkd', 'sgd', 'mxn', 'twd', 'clp', 'cop', 'ars']), fallback: 'usd' },
  kr: { codes: new Set(['sek', 'nok', 'dkk', 'isk']), fallback: null },
  '¥': { codes: new Set(['jpy', 'cny']), fallback: 'jpy' },
};

// Codes trusted as currencies; leaves out ones that double as words on receipts (ALL, TOP, PEN, CUP…).
const ISO_CODES = [
  'EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CNY', 'SEK', 'NOK', 'DKK', 'ISK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN',
  'RSD', 'TRY', 'AUD', 'CAD', 'NZD', 'HKD', 'SGD', 'MXN', 'BRL', 'ARS', 'CLP', 'COP', 'INR', 'KRW', 'THB',
  'VND', 'IDR', 'PHP', 'MYR', 'ZAR', 'AED', 'SAR', 'QAR', 'ILS', 'EGP', 'TWD', 'UAH', 'KWD', 'BHD', 'OMR',
  'JOD', 'TND',
];

/** Signs written without letters, so they need no word boundary. */
const SYMBOLS: Record<string, string> = {
  '€': 'eur', '£': 'gbp', $: '$', '¥': '¥', '￥': '¥', '円': 'jpy', '元': 'cny', '₹': 'inr', '₩': 'krw',
  '₺': 'try', '₽': 'rub', '₪': 'ils', '฿': 'thb', '₫': 'vnd', '₱': 'php', '₴': 'uah',
};

/** Lettered signs, matched only as whole words and only right next to a number. */
const WORD_MARKERS: Record<string, string> = {
  'us$': 'usd', 'a$': 'aud', 'au$': 'aud', 'c$': 'cad', 'ca$': 'cad', 'nz$': 'nzd', 'hk$': 'hkd', 's$': 'sgd',
  'mx$': 'mxn', 'nt$': 'twd', 'r$': 'brl', euro: 'eur', euros: 'eur', rmb: 'cny', 'zł': 'pln', 'kč': 'czk',
  ft: 'huf', lei: 'ron', 'лв': 'bgn', kr: 'kr', 'kr.': 'kr', 'fr.': 'chf', sfr: 'chf', 'sfr.': 'chf', tl: 'try',
  rs: 'inr', 'rs.': 'inr', rp: 'idr', rm: 'myr',
  ...Object.fromEntries(ISO_CODES.map((code) => [code.toLowerCase(), code.toLowerCase()])),
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const alternation = (keys: string[]) =>
  keys
    .sort((a, b) => b.length - a.length)
    .map(escape)
    .join('|');
const SYMBOL_ALT = alternation(Object.keys(SYMBOLS));
const WORD_ALT = alternation(Object.keys(WORD_MARKERS));

const LETTER = 'A-Za-zÀ-ÖØ-öø-ÿĀ-žΑ-ωА-я';
const CJK = '\u3040-\u30ff\u3400-\u9fff';

const MARKER_BEFORE = new RegExp(`(?:(?:^|[^${LETTER}])(${WORD_ALT})|(${SYMBOL_ALT}))\\s*:?\\s*$`, 'i');
const MARKER_AFTER = new RegExp(`^\\s*(?:(${SYMBOL_ALT})|(${WORD_ALT})(?![${LETTER}]))`, 'i');
const MARKER_ANYWHERE = new RegExp(
  `(?:^|[^A-Za-z])(US\\$|AU\\$|A\\$|CA\\$|C\\$|NZ\\$|HK\\$|S\\$|MX\\$|NT\\$|R\\$|EUROS?|${ISO_CODES.join('|')})(?![A-Za-z])|(${SYMBOL_ALT})`,
  'g'
);

const WORD_MARKER_ANYWHERE = new RegExp(`(^|[^${LETTER}])(?:${WORD_ALT})(?![${LETTER}])`, 'gi');

const markerCode = (match: string): string | null => SYMBOLS[match] ?? WORD_MARKERS[match.toLowerCase()] ?? null;

const isCode = (code: string | null): code is string => code !== null;

/** Currency signs written anywhere in a line, as raw codes. */
function markersIn(line: string): string[] {
  return [...line.matchAll(MARKER_ANYWHERE)].map((m) => markerCode(m[1] ?? m[2])).filter(isCode);
}

// ---------------------------------------------------------------------------------------
// Line keywords, matched on lowercased, accent-free text.

const ACCENTS: Record<string, string> = {
  à: 'a', á: 'a', â: 'a', ã: 'a', ä: 'a', å: 'a', æ: 'ae', ç: 'c', č: 'c', è: 'e', é: 'e', ê: 'e', ë: 'e',
  ě: 'e', ì: 'i', í: 'i', î: 'i', ï: 'i', ł: 'l', ñ: 'n', ń: 'n', ò: 'o', ó: 'o', ô: 'o', õ: 'o', ö: 'o',
  ő: 'o', ø: 'o', ř: 'r', ś: 's', š: 's', ß: 'ss', ù: 'u', ú: 'u', û: 'u', ü: 'u', ű: 'u', ů: 'u', ý: 'y',
  ÿ: 'y', ź: 'z', ż: 'z', ž: 'z',
};

function fold(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^\x00-\x7f]/g, (ch) => ACCENTS[ch] ?? ch)
      // OCR reads O as 0 and l as 1 inside words ("T0TAL").
      .replace(/([a-z])0(?=[a-z])/g, '$1o')
      .replace(/([a-z])1(?=[a-z])/g, '$1l')
  );
}

const TOTAL_WORDS =
  'grand total|total due|amount due|balance due|total to pay|to pay|total a pagar|valor a pagar|a pagar|' +
  'net a payer|a payer|total ttc|zu zahlen|gesamtbetrag|gesamtsumme|endbetrag|endsumme|zahlbetrag|' +
  'rechnungsbetrag|summe|gesamt|montant|importe|importo|totale|da pagare|totaal|te betalen|bedrag|betrag|' +
  'totalt|att betala|a betale|i alt|yhteensa|razem|suma|do zaplaty|celkem|osszesen|toplam|amount|total';
const TOTAL = new RegExp(`\\b(?:${TOTAL_WORDS})\\b`);
const TOTAL_ALL = new RegExp(`\\b(?:${TOTAL_WORDS})\\b`, 'g');
const TOTAL_CJK = /合\s?計|総計|お会計|ご請求|合计|总计|应付/;

// Lines that carry an amount which isn't the total: subtotals, tax, tips, cash handed over,
// change, discounts, item counts, pre-tax sums.
const EXCLUDE = new RegExp(
  '\\b(?:sub|subtotal|sub-total|zwischensumme|zw-summe|sous-total|sous total|subtotale|subtotaal|parcial|' +
    'tax|taxes|vat|mwst|ust|steuer|tva|iva|btw|gst|hst|pst|moms|alv|dph|kdv|ptu|fpa|imposta|imposto|' +
    'tip|tips|gratuity|trinkgeld|pourboire|propina|mancia|fooi|' +
    'change|ruckgeld|wechselgeld|rendu|monnaie|cambio|resto|troco|wisselgeld|vuelto|' +
    'tendered|given|gegeben|geg|entregado|cash|bar|bargeld|especes|efectivo|contanti|dinheiro|contant|kontant|' +
    'discount|rabatt|remise|descuento|sconto|korting|desconto|nachlass|saving|savings|saved|coupon|' +
    'items?|artikel|articles?|art|articoli|qty|quantity|anzahl|menge|stuck|pcs|unidades|' +
    'excl|exkl|ht|hors|netto|net|before tax|pre-tax|imponible|imponibile|base|points|punkte|bonus|payback)\\b'
);
const EXCLUDE_CJK = /小計|小计|税|お預|預り|預かり|お釣|おつり|釣銭|找零|现金|現金|値引|割引/;

// "incl. VAT" and "tax included" describe a total rather than a tax line.
const TAX_WORDS = 'tax|taxes|vat|mwst|ust|tva|iva|btw|gst|moms';
const INCLUDED = new RegExp(
  `\\b(?:incl|inkl|inc|including|inklusive|inclus|compris|incluido|incluida|incluso|inclusa|inclusive)\\b\\.?\\s*` +
    `(?:\\d+(?:[.,]\\d+)?\\s*%\\s*)?(?:${TAX_WORDS})\\b|\\b(?:${TAX_WORDS})\\.?\\s*(?:incl|included|inkl|inclus|incluido|incluida|incluso|inclusa|inclusive)\\b`,
  'g'
);

type LineKind = 'total' | 'excluded' | 'plain';

function classify(text: string): LineKind {
  const folded = fold(text).replace(INCLUDED, ' ');
  const cjk = text.replace(/税込み?/g, '');
  const total = TOTAL.test(folded) || TOTAL_CJK.test(cjk);
  const excluded = EXCLUDE.test(folded.replace(TOTAL_ALL, ' ')) || EXCLUDE_CJK.test(cjk);
  if (excluded) return 'excluded';
  return total ? 'total' : 'plain';
}

// ---------------------------------------------------------------------------------------
// Dates and times.

const MONTHS: string[][] = [
  ['january', 'januar', 'janner', 'janvier', 'enero', 'gennaio', 'janeiro', 'januari'],
  ['february', 'februar', 'fevrier', 'febrero', 'febbraio', 'fevereiro', 'februari'],
  ['march', 'marz', 'mars', 'marzo', 'marco', 'maart', 'mrt'],
  ['april', 'avril', 'abril', 'aprile'],
  ['may', 'mai', 'mayo', 'maggio', 'maio', 'mei'],
  ['june', 'juni', 'juin', 'junio', 'giugno', 'junho'],
  ['july', 'juli', 'juillet', 'julio', 'luglio', 'julho'],
  ['august', 'aout', 'agosto', 'augustus'],
  ['september', 'septembre', 'septiembre', 'settembre', 'setembro'],
  ['october', 'oktober', 'octobre', 'octubre', 'ottobre', 'outubro'],
  ['november', 'novembre', 'noviembre', 'novembro'],
  ['december', 'dezember', 'decembre', 'diciembre', 'dicembre', 'dezembro'],
];

function monthNumber(word: string): number | null {
  const w = fold(word);
  if (w.length < 3) return null;
  const i = MONTHS.findIndex((names) => names.some((name) => name.startsWith(w)));
  return i === -1 ? null : i + 1;
}

const pad = (n: number) => String(n).padStart(2, '0');

function isoDate(y: number, m: number, d: number): string | null {
  if (y < 2000 || y > 2099 || m < 1 || m > 12 || d < 1) return null;
  if (d > new Date(Date.UTC(y, m, 0)).getUTCDate()) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

const fullYear = (y: string) => (y.length === 2 ? 2000 + Number(y) : Number(y));

const YMD = /\b(\d{4})\s?([-/.])\s?(\d{1,2})\s?\2\s?(\d{1,2})(?!\d)/g;
const DMY = /\b(\d{1,2})\s?([./-])\s?(\d{1,2})\s?\2\s?(\d{4}|\d{2})(?![\d,]|\.\d)/g;
const YMD_CJK = /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/g;
const D_MONTH_Y = /\b(\d{1,2})(?:st|nd|rd|th)?\.?[\s-]*(?:de\s+)?([A-Za-zÀ-ÿ]{3,10})\.?,?[\s-]*(?:de\s+)?(\d{4}|\d{2})(?![\d,]|\.\d)/g;
const MONTH_D_Y = /\b([A-Za-zÀ-ÿ]{3,10})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/g;

interface DateMatch {
  start: number;
  end: number;
  /** Null for date-shaped text that isn't a real date; it's still not an amount. */
  iso: string | null;
}

function datesIn(line: string, monthFirst: boolean): DateMatch[] {
  const found: DateMatch[] = [];
  const add = (m: RegExpExecArray, iso: string | null) =>
    found.push({ start: m.index, end: m.index + m[0].length, iso });
  for (const m of line.matchAll(YMD)) add(m, isoDate(+m[1], +m[3], +m[4]));
  for (const m of line.matchAll(YMD_CJK)) add(m, isoDate(+m[1], +m[2], +m[3]));
  for (const m of line.matchAll(DMY)) {
    const [a, b, y] = [+m[1], +m[3], fullYear(m[4])];
    // Day first (Europe) unless that's impossible; US order only for "/" dates on dollar receipts.
    const [day, month] = monthFirst && m[2] === '/' ? [b, a] : [a, b];
    add(m, isoDate(y, month, day) ?? isoDate(y, day, month));
  }
  for (const m of line.matchAll(D_MONTH_Y)) {
    const month = monthNumber(m[2]);
    if (month) add(m, isoDate(fullYear(m[3]), month, +m[1]));
  }
  for (const m of line.matchAll(MONTH_D_Y)) {
    const month = monthNumber(m[1]);
    if (month) add(m, isoDate(+m[3], month, +m[2]));
  }
  return found.sort((x, y) => x.start - y.start);
}

const TIME = /(^|[^\d.,:])([01]?\d|2[0-3])(?:\s?:\s?|h)([0-5]\d)(?::[0-5]\d)?(?!\d)(?:\s*([ap])\.?\s?m\b\.?)?/gi;

function timeIn(line: string): string | null {
  for (const m of line.matchAll(TIME)) {
    let h = Number(m[2]);
    const meridiem = m[4]?.toLowerCase();
    if (meridiem && h >= 1 && h <= 12) h = (h % 12) + (meridiem === 'p' ? 12 : 0);
    return `${pad(h)}:${m[3]}`;
  }
  return null;
}

// ---------------------------------------------------------------------------------------
// Amounts.

interface Token {
  value: number;
  decimals: number;
  /** Decimal separator used, when there is one. */
  sep: '.' | ',' | null;
  /** "1,234": thousands or three decimals, settled once the whole receipt has been read. */
  alt: { sep: '.' | ','; thousands: number; decimal: number } | null;
  /** Raw currency sign next to the number: an ISO code, or "$", "kr" or "¥". */
  marker: string | null;
  negative: boolean;
}

type NumberParts = Pick<Token, 'value' | 'decimals' | 'sep' | 'alt'>;

function parseNumber(raw: string): NumberParts | null {
  let s = raw;
  if (/['’]/.test(s)) {
    // Swiss grouping: 1'234.50
    if (!/^\d{1,3}(?:['’]\d{3})+(?:[.,]\d{1,2})?$/.test(s)) return null;
    s = s.replace(/['’]/g, '');
  }
  if (s[0] === '.' || s[0] === ',') s = `0${s}`;
  const seps = s.replace(/\d/g, '');
  if (!seps) {
    // Leading zeros mean an id or postcode, not a price.
    return /^0\d/.test(s) ? null : { value: Number(s), decimals: 0, sep: null, alt: null };
  }
  const last = seps[seps.length - 1] as '.' | ',';
  const cut = s.lastIndexOf(last);
  const whole = s.slice(0, cut);
  const frac = s.slice(cut + 1);
  if (/^0\d/.test(whole)) return null;

  if (seps.includes('.') && seps.includes(',')) {
    // 1.234,56 or 1,234.56: the later separator is the decimal one.
    const other = last === '.' ? ',' : '.';
    if (!new RegExp(`^\\d{1,3}(?:\\${other}\\d{3})+$`).test(whole) || frac.length > 3) return null;
    return { value: Number(`${whole.split(other).join('')}.${frac}`), decimals: frac.length, sep: last, alt: null };
  }

  if (seps.length > 1) {
    const groups = s.split(last);
    const head = groups[0].length <= 3;
    if (head && groups.slice(1).every((g) => g.length === 3)) {
      return { value: Number(groups.join('')), decimals: 0, sep: null, alt: null };
    }
    // 1.234.56: grouped thousands where OCR mangled the decimal comma.
    const tail = groups[groups.length - 1];
    if (head && tail.length === 2 && groups.slice(1, -1).every((g) => g.length === 3)) {
      return { value: Number(`${groups.slice(0, -1).join('')}.${tail}`), decimals: 2, sep: last, alt: null };
    }
    return null;
  }

  const decimal = Number(`${whole}.${frac}`);
  if (frac.length === 3 && whole.length <= 3 && whole !== '0') {
    return { value: decimal, decimals: 3, sep: null, alt: { sep: last, thousands: Number(whole + frac), decimal } };
  }
  return { value: decimal, decimals: frac.length, sep: last, alt: null };
}

// Space-grouped thousands (1 234,56 or 1 200 Ft) become one number before tokenizing.
const SPACE_GROUPED = new RegExp(
  `(^|[^\\d.,])(\\d{1,3})((?: \\d{3})+)(?=[.,]\\d{2}(?!\\d)|[.,][-–—]|\\s?(?:${SYMBOL_ALT})|\\s?(?:${WORD_ALT})(?![${LETTER}]))`,
  'gi'
);

/** Blanks out numbers that are never prices: dates, times, card numbers, ids, phones, rates, quantities. */
function stripNonAmounts(line: string): string {
  let s = line;
  for (const d of datesIn(line, false).reverse()) s = s.slice(0, d.start) + ' '.repeat(d.end - d.start) + s.slice(d.end);
  return s
    .replace(TIME, '$1 ')
    .replace(SPACE_GROUPED, (_m, pre: string, head: string, rest: string) => pre + head + rest.replace(/ /g, ''))
    .replace(/[*xX•#]{2,}[\s*xX•-]*\d+/g, ' ')
    .replace(
      /(#|\b(?:nr|no|n°|num|ref|id|tid|mid|auth|trace|terminal|beleg|kasse|tisch|table|mesa|tavolo|check|chk|order|invoice|receipt|guests?|pax|covers?|couverts?|seat|filiale|store|markt|bed)\b\.?)\s*[:.#]?\s*\d[\d-]*/gi,
      ' '
    )
    .replace(/\+?\d[\d ()/-]{7,}\d/g, ' ')
    .replace(/\d+(?:[.,]\d+)?\s*%/g, ' ')
    // Quantities: "2 x 3,50" keeps the price, "2x Cola" and "x2" go.
    .replace(/(^|[^\d.,])\d+\s*[xX×*]\s*(?=\d)/g, '$1 ')
    .replace(/(^|[^\d.,])\d+\s*[xX×](?=\s|$)/g, '$1 ')
    .replace(/\b[xX×]\d+\b(?![.,]\d)/g, ' ')
    .replace(/(^|[^\d.,])\d+\s*@/g, '$1 ')
    .replace(/(^|[^\d.,])\d+(?:[.,]\d+)?\s*(?:kg|g|gr|l|ml|cl|lt|oz|lbs?|km|st|stk|pcs?|pz|uds?)\b\.?/gi, '$1 ');
}

const NUMBER = /(-\s?)?(\d[\d.,'’]*\d|\d|[.,]\d{2}(?!\d))([.,][-–—])?(-(?!\d))?/g;
const LETTER_BEFORE = new RegExp(`[${LETTER}]$`);

function tokensIn(line: string): Token[] {
  const s = stripNonAmounts(line);
  const tokens: Token[] = [];
  for (const m of s.matchAll(NUMBER)) {
    const before = s.slice(0, m.index);
    const markBefore = MARKER_BEFORE.exec(before);
    // Glued to a word ("A4", "DE123456789") means it's part of a name or id, unless that word is a currency.
    if (LETTER_BEFORE.test(before) && !markBefore) continue;
    const parts = parseNumber(m[2]);
    if (!parts) continue;
    const noCents = !!m[3];
    const after = s.slice(m.index + m[0].length);
    const markAfter = MARKER_AFTER.exec(after);
    const rawMarker = markBefore?.[1] ?? markBefore?.[2] ?? markAfter?.[1] ?? markAfter?.[2] ?? null;
    tokens.push({
      ...parts,
      // "5.–" is a whole amount written with a dash for the cents.
      ...(noCents && parts.decimals === 0 ? { decimals: 2, sep: m[3][0] as '.' | ',' } : {}),
      marker: rawMarker ? markerCode(rawMarker) : null,
      negative: !!m[1] || !!m[4],
    });
  }
  return tokens;
}

function resolveCurrency(marker: string | null, explicit: Set<string>, trip: string | undefined): string | null {
  if (!marker) return null;
  const family = FAMILIES[marker];
  if (!family) return marker;
  for (const code of explicit) if (family.codes.has(code)) return code;
  if (trip && family.codes.has(trip)) return trip;
  return family.fallback;
}

function mostCommon(items: string[]): string | null {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  let best: string | null = null;
  for (const [item, n] of counts) if (best === null || n > counts.get(best)!) best = item;
  return best;
}

// ---------------------------------------------------------------------------------------
// Merchant.

const HEADER = new RegExp(
  '\\b(?:receipt|invoice|welcome|bienvenue|willkommen|herzlich|bienvenido|bienvenidos|benvenuto|benvenuti|' +
    'welkom|bem-vindo|bem vindo|facture|ticket|recu|factura|simplificada|recibo|fattura|documento|kassabon|' +
    'bonnetje|copy|duplicate|duplicata|copie|kopie|copia|thank|thanks|danke|merci|gracias|grazie|obrigado|' +
    'obrigada|bedankt|cashier|kasse|kassierer|caisse|cassa|datum|fecha|uhrzeit|tel|phone|fax|fon|telefon|' +
    'telefono|email|e-mail|vat|ust|mwst|siret|siren|nif|cif|iva|btw|kvk|uid|steuernummer|st-nr|abn|gst)\\b|' +
    'beleg|rechnung|quittung|kassenbon|ricevuta|scontrino'
);
// Words that are labels on a receipt but can also be part of a name ("Time Out Market",
// "The Round Table"): only a label on a line with a number ("Table 12").
const LABEL =
  /\b(?:date|time|table|tisch|mesa|tavolo|order|server|serveur|guests?|covers?|check|customer|kunde|client|cliente|store|filiale)\b/;
const STREET = new RegExp(
  '\\b(?:street|st|ave|avenue|road|rd|blvd|boulevard|bd|lane|ln|drive|dr|place|pl|square|sq|rue|avenida|avda|av|' +
    'calle|c|plaza|placa|paseo|passeig|carrer|via|viale|piazza|corso|vicolo|largo|rua|travessa|praca|quai|' +
    'chemin|impasse)\\b|(?:strasse|str\\.|straat|gasse|weg|platz|allee|damm|ring|laan|plein|gracht|kade)(?:[\\s\\d,]|$)'
);
const POSTCODE =
  /\b\d{4,5}\s+[A-ZÀ-Ý]|\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b|\b\d{4}\s?[A-Z]{2}\b|\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b|\b\d{4}-\d{3}\b/;
const CONTACT = /\+\d|www\.|https?:|@|\.(?:com|net|org|de|fr|es|it|nl|pt|eu|at|ch|be|uk)\b/i;
const LETTERS = new RegExp(`[${LETTER}${CJK}]`, 'g');

const EDGE = `[^${LETTER}${CJK}0-9]`;
const TRIM_NAME = new RegExp(`^${EDGE}+|[^${LETTER}${CJK}0-9.!)'’]+$`, 'g');

function merchantFrom(line: string): string | null {
  const name = line.replace(TRIM_NAME, '').trim();
  const letters = (name.match(LETTERS) ?? []).join('');
  const body = name.replace(/[\s&'’.\-]/g, '');
  if (letters.length < 2 || letters.length / body.length < 0.6) return null;
  // Real names have a vowel or are short acronyms (BP, KFC, H&M); OCR noise like "lIl1" has neither.
  if (/^[A-Za-z]+$/.test(letters) && !/[aeiouy]/i.test(letters) && !(letters === letters.toUpperCase() && letters.length <= 5)) {
    return null;
  }
  const folded = fold(name);
  const digits = (name.match(/\d/g) ?? []).length;
  if (HEADER.test(folded) || CONTACT.test(name) || POSTCODE.test(name) || digits >= 7) return null;
  if (/:\s*$/.test(line) || (LABEL.test(folded) && digits > 0)) return null;
  if (digits > 0 && (STREET.test(folded) || /^\d+[a-z]?,?\s+[A-Za-zÀ-ÿ]/i.test(name))) return null;
  if (datesIn(name, false).length || tokensIn(name).some((t) => t.decimals > 0)) return null;
  return name.slice(0, 40).trim();
}

// ---------------------------------------------------------------------------------------

interface Line {
  text: string;
  kind: LineKind;
  tokens: Token[];
  /** Currency signs anywhere on the line, next to a number or not. */
  markers: string[];
}

export function parseReceipt(input: string[], opts: ParseReceiptOptions = {}): ParsedReceipt {
  const trip = opts.tripCurrency?.toLowerCase();
  const texts = input
    .flatMap((block) => block.split(/\r?\n/))
    .map((line) =>
      line
        .replace(/[\u00a0\u2007\u2009\u202f]/g, ' ')
        .replace(/\u2212/g, '-')
        .replace(/\s+/g, ' ')
        // OCR drops or adds a space around the decimal separator: "12 ,50", "12. 50".
        .replace(/(\d) ([.,])(\d{2})(?![\d.,])/g, '$1$2$3')
        .replace(/(\d)([.,]) (\d{2})(?![\d.,])/g, '$1$2$3')
        .trim()
    )
    .filter(Boolean);

  const raw: Line[] = texts.map((text) => {
    const tokens = tokensIn(text);
    return { text, kind: classify(text), tokens, markers: [...tokens.map((t) => t.marker).filter(isCode), ...markersIn(text)] };
  });
  const allTokens = raw.flatMap((l) => l.tokens);
  const allMarkers = raw.flatMap((l) => l.markers);

  // Currency codes printed anywhere settle which dollar, krone or yen a bare sign means.
  const explicit = new Set(allMarkers.filter((code) => !FAMILIES[code]));
  const resolve = (marker: string | null | undefined) => resolveCurrency(marker ?? null, explicit, trip);
  const hint = resolve(mostCommon(allTokens.map((t) => t.marker).filter(isCode))) ?? resolve(allMarkers[0]);

  // The receipt's own decimal separator, from numbers that can only be read one way.
  let dots = 0;
  let commas = 0;
  for (const t of allTokens) {
    if (t.sep === '.') dots++;
    if (t.sep === ',') commas++;
  }
  const decimalSep = dots > commas ? '.' : commas > dots ? ',' : dots === 0 ? 'none' : null;
  const zeroDecimal = (code: string | null | undefined) => !!code && ZERO_DECIMAL.has(code);
  const threeDecimal = (code: string | null | undefined) => !!code && THREE_DECIMAL.has(code);

  // "1,234" / "1.234": thousands for zero-decimal currencies, for receipts that print no
  // decimals at all, or when the receipt uses the other separator for decimals; three
  // decimals when the receipt uses this same separator for decimals (fuel prices like
  // 1,859) or the currency has three decimals. With no evidence either way it stays decimal.
  const settle = (t: Token): Token => {
    if (!t.alt) return t;
    const code = resolve(t.marker) ?? hint;
    let thousands: boolean;
    if (zeroDecimal(code)) thousands = true;
    else if (threeDecimal(code)) thousands = false;
    else if (decimalSep === 'none') thousands = true;
    else if (decimalSep) thousands = decimalSep !== t.alt.sep;
    else thousands = zeroDecimal(trip);
    return thousands ? { ...t, value: t.alt.thousands, decimals: 0 } : { ...t, value: t.alt.decimal, decimals: 3 };
  };
  const lines = raw.map((l) => ({ ...l, tokens: l.tokens.map(settle) }));

  const hasDecimals = decimalSep !== 'none';
  const plausible = (t: Token) => {
    if (t.negative || !(t.value > 0)) return false;
    const code = resolve(t.marker) ?? hint;
    if (t.value >= (zeroDecimal(code) ? 1e10 : 1e7)) return false;
    if (t.decimals > (threeDecimal(code) ? 3 : 2)) return false;
    // Bare whole numbers are counts, ids and table numbers, unless the receipt has no cents at all.
    if (t.decimals === 0) return t.marker !== null || (!hasDecimals && (zeroDecimal(hint) || zeroDecimal(trip)));
    return true;
  };
  const priced = (l: Line) => l.tokens.filter(plausible);
  const lastPriced = (l: Line) => priced(l).at(-1) ?? null;
  const letterCount = (text: string) => (text.replace(WORD_MARKER_ANYWHERE, '$1').match(LETTERS) ?? []).length;
  // A line left to fill in by hand ("Tip: ______", "Total: ______").
  const blank = (l: Line) => /_{3,}|\.{5,}/.test(l.text);
  const labelOnly = (l: Line) => !priced(l).length && !blank(l) && (l.text.match(LETTERS) ?? []).length >= 2;
  const currencyOnly = (l: Line) => labelOnly(l) && letterCount(l.text) === 0;
  const amountOnly = (l: Line) =>
    priced(l).length > 0 && l.kind !== 'excluded' && !/[%=]/.test(l.text) && letterCount(l.text) <= 1;

  // Keyword line without an amount: the amount is on a following line, or in a column of
  // amounts lined up with a column of labels.
  const amountBelow = (i: number): Token | null => {
    let before = 0;
    for (let j = i - 1; j >= 0 && labelOnly(lines[j]); j--) if (!currencyOnly(lines[j])) before++;
    let after = 0;
    let j = i + 1;
    for (; j < lines.length && j <= i + 8 && labelOnly(lines[j]); j++) if (!currencyOnly(lines[j])) after++;
    const column: Token[] = [];
    for (; j < lines.length && amountOnly(lines[j]); j++) column.push(lastPriced(lines[j])!);
    if (column.length) {
      const labels = before + 1 + after;
      return column[column.length >= labels ? before : column.length - 1 - after] ?? null;
    }
    const next = lines[i + 1];
    return next && next.kind === 'plain' ? lastPriced(next) : null;
  };

  // The last total line wins: after a tip, "Total" is printed again with the tip included.
  const totalLines = lines
    .map((l, i) => (l.kind === 'total' && !blank(l) ? i : -1))
    .filter((i) => i !== -1)
    .reverse();
  let total: { token: Token; line: number } | null = null;
  for (const i of totalLines) {
    const token = lastPriced(lines[i]) ?? amountBelow(i);
    if (token) {
      total = { token, line: i };
      break;
    }
  }
  // Settle for a bare number on a total line ("Total 12") before guessing.
  for (const i of totalLines) {
    if (total) break;
    const token = lines[i].tokens.filter((t) => !t.negative && t.value > 0).at(-1);
    if (token) total = { token, line: i };
  }

  if (!total) {
    const candidates = lines.flatMap((l, line) => (l.kind === 'excluded' ? [] : priced(l).map((token) => ({ token, line }))));
    const largest = candidates.reduce<(typeof candidates)[number] | null>(
      (best, c) => (!best || c.token.value > best.token.value ? c : best),
      null
    );
    // Cash receipts: the largest amount is often what was handed over, with the total
    // before it and the change after it adding up to it.
    const paid =
      largest &&
      candidates.find(
        (a) =>
          a.line < largest.line &&
          candidates.some((c) => c.line > largest.line && Math.abs(a.token.value + c.token.value - largest.token.value) < 0.005)
      );
    total = paid || largest;
  }

  const currency =
    resolve(total?.token.marker) ??
    resolve(total && lines[total.line].markers[0]) ??
    resolve(mostCommon(lines.flatMap(priced).map((t) => t.marker).filter(isCode))) ??
    resolve(allMarkers[0]);

  let date: string | null = null;
  let time: string | null = null;
  for (const text of texts) {
    const found = datesIn(text, (currency ?? trip) === 'usd').find((d) => d.iso);
    if (found) {
      date = found.iso;
      time = timeIn(text);
      break;
    }
  }
  if (!time) time = texts.map(timeIn).find((t) => t !== null) ?? null;

  const merchant = texts.slice(0, 5).map(merchantFrom).find((m) => m !== null) ?? null;

  const amount = total ? Number(total.token.value.toFixed(Math.min(total.token.decimals, 3))) : null;
  return { amount, currency, merchant, date, time };
}

function localIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * When a scanned expense should be dated from its receipt: a day within the trip so far,
 * at the printed time (noon without one). Null means "use now", including for a date or
 * time that is misread into the future or doesn't fit the trip.
 */
export function receiptTimestamp(
  receipt: Pick<ParsedReceipt, 'date' | 'time'>,
  trip: { startDate: string; endDate: string },
  now: number = Date.now()
): number | null {
  const { date, time } = receipt;
  const today = localIsoDate(new Date(now));
  if (!date || date < trip.startDate || date > trip.endDate || date > today) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time ? time.split(':').map(Number) : [12, 0];
  const at = new Date(y, m - 1, d, hh, mm).getTime();
  if (date === today && (!time || at > now || now - at < 15 * 60 * 1000)) return null;
  return at;
}
