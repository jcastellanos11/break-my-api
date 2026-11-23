import { createContext, useContext } from 'react';
import type { Locale, Messages } from './types';

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
}
export const I18nContext = createContext<I18nContextValue | null>(null);
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('I18nProvider is required');
  return context;
}
