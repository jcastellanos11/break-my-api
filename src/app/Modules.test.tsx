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
