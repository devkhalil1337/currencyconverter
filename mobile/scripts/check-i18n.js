#!/usr/bin/env node
/**
 * Checks the locale files in src/i18n/locales against src/i18n/en.ts:
 * - every string keeps exactly the same %{placeholders} as the English one (errors, exit 1);
 *   a plural "one" form may leave out %{count}, since some languages spell out "one";
 * - missing or extra keys (errors; tsc catches these too);
 * - strings still identical to English, unless whitelisted below (warnings only).
 *
 * Usage: npm run check:i18n [-- --verbose]
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const I18N_DIR = path.join(__dirname, '..', 'src', 'i18n');
const LOCALES_DIR = path.join(I18N_DIR, 'locales');
const VERBOSE = process.argv.includes('--verbose');

// Keys whose English text is fine to keep as-is (brand names, codes, symbols).
const SAME_AS_ENGLISH_KEYS = new Set([
  'common.pro',
  'common.fromTo',
  'common.percent',
  'settings.proTitle',
  'notifications.body',
  'expense.approx',
]);
// Values that are fine to keep in any language.
const SAME_AS_ENGLISH_VALUES = new Set(['Trippence Pro', 'PRO', 'CSV', 'OK']);

function loadModule(file, cache = {}) {
  if (cache[file]) return cache[file].exports;
  const source = fs.readFileSync(file, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: file,
  });
  const mod = { exports: {} };
  cache[file] = mod;
  const localRequire = (spec) => {
    if (spec.startsWith('.')) {
      const base = path.resolve(path.dirname(file), spec);
      const candidates = [`${base}.ts`, path.join(base, 'index.ts')];
      const found = candidates.find((c) => fs.existsSync(c));
      if (!found) throw new Error(`Cannot resolve ${spec} from ${file}`);
      // Locale files may only depend on en.ts; anything else (like the index) is type-only.
      if (path.basename(found) === 'index.ts') return {};
      return loadModule(found, cache);
    }
    throw new Error(`Locale files must not import packages (${spec} in ${file})`);
  };
  new Function('require', 'module', 'exports', outputText)(localRequire, mod, mod.exports);
  return mod.exports;
}

function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[full] = value;
    else if (value && typeof value === 'object') flatten(value, full, out);
    else out[full] = value;
  }
  return out;
}

function placeholders(text) {
  return [...new Set([...String(text).matchAll(/%\{(\w+)\}/g)].map((m) => m[1]))].sort();
}

const en = flatten(loadModule(path.join(I18N_DIR, 'en.ts')).en);
const files = fs
  .readdirSync(LOCALES_DIR)
  .filter((f) => f.endsWith('.ts'))
  .sort();

let errors = 0;
let warnings = 0;

for (const file of files) {
  const code = path.basename(file, '.ts');
  const exported = loadModule(path.join(LOCALES_DIR, file))[code];
  if (!exported) {
    console.log(`\n[${code}] ERROR: ${file} must export \`const ${code}: Messages\``);
    errors++;
    continue;
  }
  const messages = flatten(exported);
  const problems = [];
  const same = [];

  for (const [key, english] of Object.entries(en)) {
    if (!(key in messages)) {
      problems.push(`missing key ${key}`);
      continue;
    }
    const text = messages[key];
    if (typeof text !== 'string') {
      problems.push(`${key} is not a string`);
      continue;
    }
    const want = placeholders(english);
    const got = placeholders(text);
    const optionalCount = key.endsWith('.one') ? ['count'] : [];
    const missing = want.filter((p) => !got.includes(p) && !optionalCount.includes(p));
    const extra = got.filter((p) => !want.includes(p));
    if (missing.length || extra.length) {
      const parts = [];
      if (missing.length) parts.push(`missing %{${missing.join('}, %{')}}`);
      if (extra.length) parts.push(`unknown %{${extra.join('}, %{')}}`);
      problems.push(`${key}: ${parts.join('; ')}\n      en: ${JSON.stringify(english)}\n      ${code}: ${JSON.stringify(text)}`);
    }
    const allowed =
      SAME_AS_ENGLISH_KEYS.has(key) ||
      SAME_AS_ENGLISH_KEYS.has(key.replace(/\.(one|other)$/, '')) ||
      SAME_AS_ENGLISH_VALUES.has(english) ||
      key.startsWith('rates.ranges.') ||
      !/[A-Za-z]{2}/.test(english.replace(/%\{\w+\}/g, ''));
    if (text === english && !allowed) same.push(key);
  }
  for (const key of Object.keys(messages)) {
    if (!(key in en)) problems.push(`extra key ${key}`);
  }

  errors += problems.length;
  warnings += same.length;
  const status = problems.length ? 'FAIL' : 'ok';
  console.log(`\n[${code}] ${status}: ${problems.length} error(s), ${same.length} of ${Object.keys(en).length} strings still in English`);
  for (const p of problems) console.log(`  ERROR ${p}`);
  const shown = VERBOSE ? same : same.slice(0, 5);
  for (const key of shown) console.log(`  warn  untranslated ${key}: ${JSON.stringify(en[key])}`);
  if (shown.length < same.length) console.log(`  … and ${same.length - shown.length} more (use --verbose to list all)`);
}

console.log(`\n${files.length} locale(s), ${Object.keys(en).length} strings: ${errors} error(s), ${warnings} warning(s).`);
process.exit(errors > 0 ? 1 : 0);
