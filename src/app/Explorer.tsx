import { searchable } from './searchable';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useI18n } from '../i18n/context';
import { statusPath } from './navigation';
import { catalog, mdn, registry, simulatedCodes } from './statusCatalog';

const familyKeys = ['f1', 'f2', 'f3', 'f4', 'f5'] as const;

const narrow = '(max-width: 47.99rem)';
function phoneWidth() { return window.matchMedia?.(narrow).matches ?? false; }
function subscribeWidth(update: () => void) {
  const media = window.matchMedia?.(narrow);
  media?.addEventListener('change', update);
  return () => media?.removeEventListener('change', update);
}

export function Explorer() {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState('');
  const selection = new URLSearchParams(location.search).get('code');
  const selected = catalog.find(row => String(row.code) === selection);
  const matches = catalog.filter(row => {
    if (!String(row.code).startsWith(family)) return false;
    const keywords = [row.code, row.phrase, row.title[locale],
      row.summary[locale], row.technical[locale], row.example[locale]];
    return searchable(keywords.join(' ')).includes(searchable(query));
  });

  const phone = useSyncExternalStore(subscribeWidth, phoneWidth);
  const list = useRef<HTMLDivElement>(null);
  const previous = useRef(selection);
  useEffect(() => {
    const prior = previous.current;
    previous.current = selection;
    if (prior && !selection) {
      const target = list.current?.querySelector<HTMLAnchorElement>('a[href="' + statusPath(Number(prior)) + '"]');
      (target ?? list.current?.querySelector('input'))?.focus();
    }
  }, [selection]);

  return <div className="catalog-layout">
    <div className="catalog-results" ref={list} hidden={phone && !!selection}>
      <div className="reader-controls">
        <label>{t.search}<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
        <label>{t.family}<select value={family} onChange={event => setFamily(event.target.value)}>
          <option value="">{t.families}</option>
          {familyKeys.map((key, i) => <option key={key} value={i + 1}>{i + 1}xx · {t[key]}</option>)}
        </select></label>
      </div>
      <p role="status">{t.results} · {matches.length}</p>
      <ul className="status-grid">{matches.map(row => <li key={row.code}>
        <a href={statusPath(row.code)} aria-current={row === selected ? 'page' : undefined}><b>{row.code}</b> {row.title[locale]}</a>
      </li>)}</ul>
      {matches.length === 0 && <div><p>{t.missing}</p><button onClick={() => {setQuery(''); setFamily(''); list.current?.querySelector('input')?.focus();}}>{t.clearFilters}</button></div>}
    </div>
    {selection && <div className="catalog-detail">
      <a className="return-link" href="/learn/http-status"><span aria-hidden="true">← </span>{t.backResults}</a>
      {selected ? <article className="reader detail">
      <p className="detail-label">{t.openDetail}</p>
      <h2 tabIndex={-1} data-route-heading>{selected.code} · {selected.title[locale]}</h2>
      <p><span lang="en">{selected.phrase}</span> · {Math.floor(selected.code / 100)}xx · {t[familyKeys[Math.floor(selected.code / 100) - 1]!]}</p>
      <strong className="catalog-badge">{simulatedCodes.has(selected.code) ? t.simBadge : t.refBadge}</strong>
      <p>{selected.summary[locale]}</p>
      <h3>{t.technical}</h3><p>{selected.technical[locale]}</p>
      <h3>{t.illustrated}</h3><p>{selected.example[locale]}</p>
      <p>{t.related} · {selected.related.map(code => <a key={code} href={statusPath(code)}>{code} </a>)}</p>
      <a href={registry}>IANA</a> · <a href={mdn + '/' + selected.code}>MDN · HTTP {selected.code}</a>
    </article> : <p tabIndex={-1} data-route-heading>{t.missing}</p>}
    </div>}
    <footer className="catalog-sources"><p>{t.coverage}</p><a href={registry}>IANA</a> · <a href={mdn}>MDN</a></footer>
  </div>;
}
