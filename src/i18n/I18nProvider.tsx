import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { en } from './en';
import { es } from './es';
import { I18nContext } from './context';
import type { Locale } from './types';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  return <I18nContext.Provider value={{ locale, setLocale, t: locale === 'es' ? es : en }}>{children}</I18nContext.Provider>;
}
