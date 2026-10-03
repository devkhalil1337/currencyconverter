/** Languages the app is translated into, with their names in that language. */
export const SUPPORTED = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'nl', name: 'Nederlands' },
] as const;

export type LanguageCode = (typeof SUPPORTED)[number]['code'];

/** The saved choice; "system" follows the device's language list. */
export type LanguagePref = 'system' | LanguageCode;

export function isSupported(code: string | null | undefined): code is LanguageCode {
  return SUPPORTED.some((l) => l.code === code);
}

export function nativeName(code: LanguageCode): string {
  return SUPPORTED.find((l) => l.code === code)?.name ?? code;
}
