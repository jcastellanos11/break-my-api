import type { en } from './en';
export type Locale = 'en' | 'es';
export type Messages = { readonly [K in keyof typeof en]: string };
