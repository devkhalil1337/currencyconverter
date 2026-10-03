import { Fragment, type ReactNode } from 'react';

import { useLocaleKey } from '@/i18n';

/**
 * Remounts its children when the language changes. useT() updates text by itself, but numbers
 * and dates formatted inside memoized components would otherwise keep the old locale.
 */
export function LocaleBoundary({ children }: { children: ReactNode }) {
  const localeKey = useLocaleKey();
  return <Fragment key={localeKey}>{children}</Fragment>;
}
