import { searchable } from './searchable';
import { Methods } from './Methods';
import { useState } from 'react';
import { useI18n } from '../i18n/context';
import { terms } from './insights';
import { statusPath } from './navigation';
import { Explorer } from './Explorer';

const chapters = [['defapiTerm','fundRequest'], ['fundCapacityTitle','fundCapacity'], ['fundProtectTitle','fundProtect'], ['explorer','fundFamilies']] as const;
const motifPaths = [
  'M4 11h24v17H4z M4 11l12 9 12-9 M34 15h13m-13 6h9',
  'M6 8h22v14H6z M12 14h8 M18 23v9h27V17H31 M24 26h13',
  'M8 10h29v22H8z M14 5h29v21 M14 17h15m-15 6h9',
];

function Glossary() {
  const { t, technical, setTechnical, locale } = useI18n();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
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
    {matches.map(term => <article className="term-row" key={term}>
      <h2><button type="button" aria-expanded={expanded === term} aria-controls={'term-'+term}
        onClick={() => setExpanded(expanded === term ? null : term)}>{t[`def${term}Term`]}<span aria-hidden="true">{expanded === term ? '−' : '+'}</span></button></h2>
      <div id={'term-'+term} hidden={expanded !== term}>
      <p>{t[`def${term}${technical ? 'Tech' : 'Simple'}`]}</p>
      {term === 'reject' && <a href={statusPath(429)}>HTTP 429</a>}
      {term === 'overflow' && <a href={statusPath(503)}>HTTP 503</a>}
      </div>
    </article>)}
  </>;
}

export function LearnCenter({ path }: { path: string }) {
  const { t } = useI18n();
  const pages = [
    { path: '/learn/fundamentals', title: t.fundamentals, summary: t.fundIntro },
    { path: '/learn/http-status', title: t.explorer, summary: t.statusIntro },
    { path: '/learn/glossary', title: t.gloss, summary: t.glossIntro },
    { path: '/learn/http-methods', title: t.methods, summary: t.methodsIntro },
  ];
  const title = path === '/about' ? t.about : pages.find(page => page.path === path)?.title ?? t.learn;
  const hasDetail = (path === '/learn/http-status' && Boolean(new URLSearchParams(location.search).get('code'))) || (path === '/learn/http-methods' && Boolean(new URLSearchParams(location.search).get('method')));

  return <section className="learn-page">
    <h1 tabIndex={-1} data-route-heading={hasDetail ? undefined : true}>{title}</h1>
    {path === '/about' ? <>
      <div className="reading-column"><h2>{t.modelScope}</h2><p>{t.aboutCopy}</p><p>{t.safety}</p></div>
      <a href="https://github.com/jcastellanos11/break-my-api">{t.repository}</a>
    </> : <>
      {path !== '/learn' && <nav aria-label={t.learn}>{pages.map(page =>
        <a key={page.path} href={page.path} aria-current={path === page.path ? 'page' : undefined}>{page.title}</a>)}</nav>}
      {path === '/learn/http-status' ? <Explorer /> : path === '/learn/http-methods' ? <Methods /> : path === '/learn/glossary' ? <Glossary /> :
        path === '/learn/fundamentals' ? <>
          <nav className="outline" aria-label={t.outline}>{chapters.map(([heading, body]) =>
            <a href={'#'+body} key={body}>{t[heading]}</a>)}</nav>
          <div className="reading-column">{chapters.map(([heading, body]) =>
            <section key={body} id={body} tabIndex={-1}><h2>{t[heading]}</h2><p>{t[body]}</p>
              {body === 'fundRequest' && <figure className="exchange" aria-labelledby="exchange-caption"><figcaption id="exchange-caption">{t.fiction}</figcaption>
                <dl><dt>{t.request}</dt><dd><code>GET /api/products</code></dd>
                <dt>{t.response}</dt><dd><code>200 OK<br/>{t.json}</code></dd></dl></figure>}
            </section>)}</div>
          <a href="/playground">{t.start}</a>
        </> : <>
          <p>{t.learnIntro}</p><div className="learn-index">{pages.map((page, index) =>
            <a key={page.path} href={page.path} aria-label={page.title}>
              <svg aria-hidden="true" viewBox="0 0 52 38" className={'card-motif motif-'+index}><path d={motifPaths[index]} /></svg>
              <h2>{page.title} <span aria-hidden="true">↗</span></h2><p>{page.summary}</p>
            </a>)}</div>
        </>}
    </>}
  </section>;
}
