import { useSyncExternalStore } from 'react';
import type { MouseEvent } from 'react';

const pages = ['/', '/playground', '/learn', '/learn/fundamentals', '/learn/http-status', '/learn/http-methods', '/learn/glossary', '/about'];
function subscribe(update: () => void) {
  window.addEventListener('popstate', update);
  return () => window.removeEventListener('popstate', update);
}
export function useRoute() {
  return useSyncExternalStore(subscribe, () => (location.pathname.replace(/\/+$/, '') || '/') + location.search);
}
export function navigate(event: MouseEvent) {
  const link = event.target instanceof Element ? event.target.closest('a') : null;
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || !link.getAttribute('href')?.startsWith('/')) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || !pages.includes(url.pathname)) return;
  event.preventDefault();
  history.pushState({}, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
export const statusPath = (code: number) => '/learn/http-status?code=' + code;
