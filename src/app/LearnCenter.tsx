import { useState } from 'react';
import { useI18n } from '../i18n/context';
import { terms } from './insights';
import { statusPath } from './navigation';
import { catalog, mdn, registry, simulatedCodes } from './statusCatalog';

const familyKeys = ['f1', 'f2', 'f3', 'f4', 'f5'] as const;

function searchable(text: string) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

function Explorer() {
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

  return <>
    <p>{t.coverage}</p>
    {selection && (selected ? <article className="reader detail">
      <h2 tabIndex={-1} data-route-heading>{selected.code} · {selected.title[locale]}</h2>
      <p><span lang="en">{selected.phrase}</span> · {Math.floor(selected.code / 100)}xx · {t[familyKeys[Math.floor(selected.code / 100) - 1]!]}</p>
      <strong>{simulatedCodes.has(selected.code) ? t.simBadge : t.refBadge}</strong>
      <p>{selected.summary[locale]}</p>
      <h3>{t.technical}</h3><p>{selected.technical[locale]}</p>
      <h3>{t.illustrated}</h3><p>{selected.example[locale]}</p>
      <p>{t.related} · {selected.related.map(code => <a key={code} href={statusPath(code)}>{code} </a>)}</p>
      <a href={registry}>IANA</a> · <a href={mdn + '/' + selected.code}>MDN · HTTP {selected.code}</a>
    </article> : <p role="status">{t.missing}</p>)}
    <div className="reader-controls">
      <label>{t.search}<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <label>{t.family}<select value={family} onChange={event => setFamily(event.target.value)}>
        <option value="">{t.families}</option>
        {familyKeys.map((key, i) => <option key={key} value={i + 1}>{i + 1}xx · {t[key]}</option>)}
      </select></label>
    </div>
    <ul className="status-grid">{matches.map(row => <li key={row.code}>
      <a href={statusPath(row.code)}><b>{row.code}</b> {row.title[locale]}</a>
    </li>)}</ul>
    {matches.length === 0 && <p role="status">{t.missing}</p>}
    <p><a href={registry}>IANA</a> · <a href={mdn}>MDN</a></p>
  </>;
}

function Glossary() {
  const { t, technical, setTechnical, locale } = useI18n();
  const [query, setQuery] = useState('');
  const matches = terms.filter(term => searchable(t[`def${term}Term`]).includes(searchable(query)))
    .sort((a, b) => t[`def${a}Term`].localeCompare(t[`def${b}Term`], locale));
  return <>
    <div className="reader-controls">
      <label>{t.search}<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <label>{t.depth}<select value={technical ? 'technical' : 'simple'}
        onChange={event => setTechnical(event.target.value === 'technical')}>
        <option value="simple">{t.simple}</option><option value="technical">{t.technical}</option>
      </select></label>
    </div>
    {matches.length === 0 && <p role="status">{t.missing}</p>}
    {matches.map(term => <article className="reader" key={term}>
      <h2>{t[`def${term}Term`]}</h2>
      <p>{t[`def${term}${technical ? 'Tech' : 'Simple'}`]}</p>
      {term === 'reject' && <a href={statusPath(429)}>HTTP 429</a>}
      {term === 'overflow' && <a href={statusPath(503)}>HTTP 503</a>}
    </article>)}
  </>;
}

export function LearnCenter({ path }: { path: string }) {
  const { t } = useI18n();
  const pages = [
    { path: '/learn/fundamentals', title: t.fundamentals, summary: t.fundIntro },
    { path: '/learn/http-status', title: t.explorer, summary: t.statusIntro },
    { path: '/learn/glossary', title: t.gloss, summary: t.glossIntro },
  ];
  const title = path === '/about' ? t.about : pages.find(page => page.path === path)?.title ?? t.learn;
  const hasDetail = path === '/learn/http-status' && Boolean(new URLSearchParams(location.search).get('code'));

  return <section className="learn-page">
    <h1 tabIndex={-1} data-route-heading={hasDetail ? undefined : true}>{title}</h1>
    {path === '/about' ? <>
      <p>{t.aboutCopy}</p><p>{t.safety}</p>
      <a href="https://github.com/jcastellanos11/break-my-api">{t.repository}</a>
    </> : <>
      {path !== '/learn' && <nav aria-label={t.learn}>{pages.map(page =>
        <a key={page.path} href={page.path} aria-current={path === page.path ? 'page' : undefined}>{page.title}</a>)}</nav>}
      {path === '/learn/http-status' ? <Explorer /> : path === '/learn/glossary' ? <Glossary /> :
        path === '/learn/fundamentals' ? <>
          {([['defapiTerm','fundRequest'], ['fundCapacityTitle','fundCapacity'], ['fundProtectTitle','fundProtect'], ['explorer','fundFamilies']] as const).map(([heading, body]) =>
            <article className="reader" key={body}><h2>{t[heading]}</h2><p>{t[body]}</p></article>)}
          <a href="/playground">{t.start}</a>
        </> : <>
          <p>{t.learnIntro}</p><div className="learn-index">{pages.map(page =>
            <a key={page.path} href={page.path} aria-label={page.title}>
              <h2>{page.title}</h2><p>{page.summary}</p>
            </a>)}</div>
        </>}
    </>}
  </section>;
}
