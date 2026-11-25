// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n/I18nProvider';
import { en } from '../i18n/en';
import { es } from '../i18n/es';
import { App } from './App';
import { terms } from './insights';
import { catalog, simulatedCodes } from './statusCatalog';

function open(path: string) {
  history.replaceState(null, '', path);
  return render(<I18nProvider><App /></I18nProvider>);
}
function follow(name: string) {
  fireEvent.click(screen.getByRole('link', { name }));
}
afterEach(() => {
  cleanup();
  history.replaceState(null, '', '/');
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('opens shared status URLs and restores them through real browser History traversal', async () => {
  open('/learn/http-status?code=304');
  expect(screen.getByRole('heading',{name:'304 · Not Modified'})).toBeVisible();
  follow(en.about);
  expect(screen.getByRole('heading',{level:1})).toHaveFocus();
  history.back();
  await waitFor(()=>expect(screen.getByRole('heading',{name:'304 · Not Modified'})).toHaveFocus());
  history.forward();
  await waitFor(()=>expect(screen.getByRole('heading',{name:en.about})).toHaveFocus());
});

it.each([en, es])('renders every module, filters the catalog and shares all twenty terms', t => {
  open('/playground');
  if (t===es) fireEvent.click(screen.getByRole('button',{name:'Español'}));
  for (const [path, heading] of [['/learn',t.learn],['/learn/fundamentals',t.fundamentals],['/learn/http-status',t.explorer],['/learn/glossary',t.gloss],['/about',t.about],['/playground',t.experiment]] as const) {
    fireEvent.click(document.querySelector<HTMLAnchorElement>('a[href="'+path+'"]')!);
    expect(screen.getByRole('heading',{level:1,name:heading!})).toBeVisible();
  }
  follow(t.learn); follow(t.gloss);
  const glossary = document.querySelector('.learn-page')!;
  expect(glossary.querySelectorAll('article')).toHaveLength(terms.length);
  expect(screen.getByRole('searchbox',{name:t.search})).toBeVisible();
});

it('limits by family, searches localized text, and distinguishes missing or unsupported selections', () => {
  open('/learn/http-status');
  const page = within(document.querySelector<HTMLElement>('.learn-page')!);
  fireEvent.change(page.getByLabelText(en.family),{target:{value:'4'}});
  expect(page.queryByRole('link',{name:/^200 /})).toBeNull();
  fireEvent.change(page.getByRole('searchbox'),{target:{value:'credenciales'}});
  expect(page.getByText(en.missing)).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:'Español'}));
  expect(page.getByRole('link',{name:/^401 /})).toBeVisible();
  fireEvent.change(page.getByRole('searchbox'),{target:{value:'999'}});
  expect(page.getByText(es.missing)).toBeVisible();
});

it('retains pending capacity, queue, history and tour through reference and help interactions', async () => {
  vi.useFakeTimers();
  const interval=vi.spyOn(window,'setInterval');
  const view=open('/playground');
  fireEvent.change(screen.getByLabelText(en.scenario),{target:{value:'autoScaleRecovery'}});
  const button=(name:string)=>fireEvent.click(screen.getByRole('button',{name}));
  button(en.play); button(en.tour); button(en.next);
  act(()=>vi.advanceTimersByTime(2000));
  button(en.pause);
  const tourPanel=screen.getByRole('complementary',{name:en.tour});
  expect(within(tourPanel).getByText(en.two)).toBeVisible();
  const historyBefore = screen.getByRole('table',{hidden:true}).querySelector('tbody')?.textContent;
  const gauge=(label:string)=>screen.getByText(label,{selector:'dt'}).nextElementSibling?.textContent;
  const backlog=gauge(en.waiting);
  expect(Number(backlog)).toBeGreaterThan(0);
  expect(gauge(en.pending)).toBe('1');
  const help=screen.getByRole('button',{name:en.help+' · '+en.incomingRps+' · '+en.configTitle});
  help.focus();
  fireEvent.click(help);
  expect(help).toHaveAttribute('aria-expanded','true');
  fireEvent.keyDown(help,{key:'Escape'});
  expect(help).toHaveFocus();

  for(const [key,code] of [['completed200',200],['rejected429',429],['rejected503',503]] as const){
    follow(en[key]);
    expect(location.search).toBe('?code='+code);
    expect(screen.getByText(en.simBadge)).toBeVisible();
    follow(en.experiment);
  }
  follow(en.learn); follow(en.gloss);
  fireEvent.change(screen.getByRole('searchbox'),{target:{value:'p95'}});
  fireEvent.change(screen.getByRole('combobox',{name:en.depth}),{target:{value:'technical'}});
  button('Español');
  act(()=>vi.advanceTimersByTime(4000));
  follow(es.experiment);
  expect(screen.getByRole('combobox',{name:es.depth})).toHaveValue('technical');
  expect(screen.getByRole('complementary',{name:es.tour})).toBe(tourPanel);
  expect(within(tourPanel).getByText(es.two)).toBeVisible();
  expect(screen.getByRole('table',{hidden:true}).querySelector('tbody')?.textContent).toBe(historyBefore);
  expect(gauge(es.waiting)).toBe(backlog);
  expect(gauge(es.pending)).toBe('1');
  button(es.resume); follow(es.about);
  expect(interval).toHaveBeenCalledTimes(2);
  act(()=>vi.advanceTimersByTime(2000));
  follow(es.experiment);
  expect(gauge(es.pending)).toBe('0');
  expect(screen.getByText(es.clock+' · 4 s')).toBeVisible();
  view.unmount();
  expect(interval).toHaveBeenCalledTimes(2);
});

it('has unique codes, translated details, valid related links and exactly three engine outcomes', () => {
  const numbers=new Set(catalog.map(r=>r.code));
  expect(numbers.size).toBe(catalog.length);
  expect([...simulatedCodes]).toEqual([200,429,503]);
  for(const record of catalog){
    expect(record.related.every(code=>numbers.has(code))).toBe(true);
    for(const key of ['summary','technical','example','title'] as const){
      expect(record[key].es.trim()).not.toBe('');
      expect(record[key].en.trim()).not.toBe('');
    }
  }
  const examples = [
    [200, /GET/i, /GET/i],
    [203, /proxy/i, /proxy/i],
    [204, /no body/i, /carece de cuerpo/i],
    [301, /Location/i, /Location/i],
    [304, /If-None-Match/i, /If-None-Match/i],
    [401, /WWW-Authenticate/i, /WWW-Authenticate/i],
    [403, /editors/i, /editores/i],
    [404, /unknown order/i, /pedido desconocido/i],
    [429, /Retry-After/i, /Retry-After/i],
    [500, /exception/i, /excepción/i],
    [503, /overload/i, /sobrecarga/i],
  ] as const;
  for (const [code, english, spanish] of examples) {
    const example = catalog.find(row => row.code === code)?.example;
    expect(example?.en).toMatch(english);
    expect(example?.es).toMatch(spanish);
  }
});

it('opens help from the keyboard and dismisses it back to the same control', async () => {
  open('/playground');
  const user=userEvent.setup();
  const help=screen.getByRole('button',{name:en.help+' · '+en.processingTimeMs+' · '+en.configTitle});
  help.focus();
  await user.keyboard('{Enter}');
  expect(help).toHaveAttribute('aria-expanded','true');
  expect(screen.getByRole('region',{name:en.processingTimeMs})).toHaveTextContent(en.serviceMeaning);
  await user.keyboard('{Escape}');
  expect(help).toHaveFocus();
  expect(help).toHaveAttribute('aria-expanded','false');
});

function phoneExplorer(path: string) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.startsWith('(max-width'), addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
  open(path);
}

it('opens one phone detail and returns keyboard focus to the filtered Spanish result', async () => {
  phoneExplorer('/learn/http-status');
  fireEvent.click(screen.getByRole('button', { name: 'Español' }));
  const search = screen.getByRole('searchbox');
  fireEvent.change(search, { target: { value: '429' } });
  fireEvent.change(screen.getByLabelText(es.family), { target: { value: '4' } });
  const result = screen.getByRole('link', { name: /^429 / });
  result.focus();
  await userEvent.setup().keyboard('{Enter}');
  expect(screen.getByRole('heading', { name: /^429 ·/ })).toHaveFocus();
  expect(screen.queryByRole('searchbox')).toBeNull();
  expect(screen.getByText(es.simBadge)).toBeVisible();
  follow(es.backResults);
  expect(result).toHaveFocus();
  expect(search).toHaveValue('429');
  expect(screen.getByLabelText(es.family)).toHaveValue('4');
  expect(location.search).toBe('');
});

it('returns from a phone deep link with no prior catalog entry and traverses that visit', async () => {
  phoneExplorer('/learn/http-status?code=503');
  expect(screen.queryByRole('searchbox')).toBeNull();
  follow(en.backResults);
  expect(screen.getByRole('link', { name: /^503 / })).toHaveFocus();
  history.back();
  await waitFor(() => expect(screen.getByRole('heading', { name: /^503 ·/ })).toHaveFocus());
  history.forward();
  await waitFor(() => expect(screen.getByRole('link', { name: /^503 / })).toHaveFocus());
});

it('keeps an out-of-filter detail explicit and clears empty results without changing its URL', () => {
  open('/learn/http-status?code=503');
  const search = screen.getByRole('searchbox');
  fireEvent.change(search, { target: { value: '429' } });
  fireEvent.change(screen.getByLabelText(en.family), { target: { value: '4' } });
  expect(screen.getByRole('link', { name: /^429 / })).toBeVisible();
  expect(screen.queryByRole('link', { name: /^503 / })).toBeNull();
  expect(screen.getByText(en.openDetail)).toBeVisible();
  expect(screen.getByRole('heading', { name: /^503 ·/ })).toBeVisible();
  expect(location.search).toBe('?code=503');
  follow(en.backResults);
  expect(search).toHaveFocus();
  fireEvent.change(search, { target: { value: 'none123' } });
  fireEvent.click(screen.getByRole('button', { name: en.clearFilters }));
  expect(search).toHaveValue('');
  expect(screen.getByLabelText(en.family)).toHaveValue('');
  fireEvent.click(screen.getByRole('link', { name: /^304 / }));
  expect(screen.getByText(en.refBadge)).toBeVisible();
  const related = catalog.find(row => row.code === 304)!.related[0]!;
  follow(String(related));
  expect(location.search).toBe('?code='+related);
});

it('keeps the expanded glossary term through depth and locale changes and searches accented terms', async () => {
  open('/learn/glossary');
  const term = screen.getByRole('button', { name: en.defcacheTerm });
  term.focus();
  await userEvent.setup().keyboard('{Enter}');
  expect(screen.getByText(en.defcacheSimple)).toBeVisible();
  fireEvent.change(screen.getByRole('combobox', { name: en.depth }), { target: { value: 'technical' } });
  fireEvent.click(screen.getByRole('button', { name: 'Español' }));
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'cache' } });
  expect(screen.getByRole('button', { name: es.defcacheTerm })).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText(es.defcacheTech)).toBeVisible();
  fireEvent.click(term);
  expect(screen.getByText(es.defcacheTech)).not.toBeVisible();
});

it.each([en, es])('offers three labeled reading destinations and a fictional exchange before opening the lab', t => {
  open('/learn');
  if (t === es) fireEvent.click(screen.getByRole('button', { name: 'Español' }));
  for (const [name, description, route] of [
    [t.fundamentals, t.fundIntro, 'fundamentals'],
    [t.explorer, t.statusIntro, 'http-status'],
    [t.gloss, t.glossIntro, 'glossary'],
  ] as const) {
    const card = screen.getByRole('link', { name });
    expect(card).toHaveAttribute('href', '/learn/' + route);
    expect(card).toHaveTextContent(description);
  }
  follow(t.fundamentals);
  expect(screen.getByRole('navigation', { name: t.outline })).toBeVisible();
  const exchange = screen.getByRole('figure', { name: t.fiction });
  expect(exchange).toHaveTextContent('GET /api/products');
  expect(exchange).toHaveTextContent('200 OK');
  follow(t.start);
  expect(screen.getByRole('article', { name: t.awaitWindow })).toBeVisible();
});
