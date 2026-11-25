// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from './App';
import { I18nProvider } from '../i18n/I18nProvider';
import { en } from '../i18n/en';
import { es } from '../i18n/es';
import { advanceSimulation, createSimulation, getSimulationSnapshot, presets } from '../engine';

function openPhone() {
  vi.stubGlobal('matchMedia', () => ({matches:false, addEventListener:vi.fn(), removeEventListener:vi.fn()}));
  history.replaceState(null, '', '/playground');
  render(<I18nProvider><App/></I18nProvider>);
}
const click = (name:string) => fireEvent.click(screen.getByRole('button',{name}));
const tick = (ms:number) => act(()=>vi.advanceTimersByTime(ms));
const settings = (name:string) => screen.getByRole('button',{name:new RegExp(name)});
afterEach(()=>{cleanup();history.replaceState(null,'','/');vi.useRealTimers();vi.unstubAllGlobals();});

it.each([en,es])('keeps the primary measurements first, with one observed window shared by all three', t => {
  vi.useFakeTimers(); openPhone();
  if (t===es) click('Español');
  expect(settings(t.configureLab)).toHaveAttribute('aria-expanded','false');
  const ready = screen.getByRole('article',{name:t.awaitWindow});
  expect(within(ready).getAllByText(t.noData)).toHaveLength(3);
  expect(ready.compareDocumentPosition(settings(t.configureLab)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  click(t.play); tick(750);
  expect(ready).toHaveTextContent(t.noData);
  tick(250);
  const w = getSimulationSnapshot(advanceSimulation(createSimulation(presets.healthy),1000)).window!;
  const group = screen.getByRole('article',{name:t.window+' · 0–1 s'});
  const values = within(group).getAllByRole('definition').map(dd=>dd.textContent);
  expect(values).toEqual([w.incomingRps+' '+t.rateUnit,w.throughputRps+' '+t.rateUnit,w.p95Ms+' ms']);
  click(t.pause); tick(2500);
  expect(group).toHaveAccessibleName(t.window+' · 0–1 s');
  click(t.resume); tick(1000);
  expect(group).toHaveAccessibleName(t.window+' · 1–2 s');
  expect(screen.getAllByRole('img',{name:t.trafficChart})).toHaveLength(1);
  expect(screen.getAllByRole('img',{name:t.queueChart})).toHaveLength(1);
  fireEvent.click(screen.getByText(t.table,{selector:'summary'}));
  expect(screen.getByRole('table',{name:t.table})).toBeVisible();
  click(t.reset);
  expect(within(ready).getAllByText(t.noData)).toHaveLength(3);
});

it('shows a measured zero throughput and an empty p95 when the first second has no completions',()=>{
  vi.useFakeTimers(); openPhone(); fireEvent.click(settings(en.configureLab));
  fireEvent.change(screen.getByLabelText(en.processingTimeMs),{target:{value:'1000'}});
  click(en.play); tick(1000);
  const values=within(screen.getByRole('article',{name:en.window+' · 0–1 s'})).getAllByRole('definition');
  expect(values[1]).toHaveTextContent('0 '+en.rateUnit);
  expect(values[2]).toHaveTextContent(en.noData);
});

it('reveals protection before focusing its checkbox, without enabling the cache',async ()=>{
  openPhone(); click(en.tour); click(en.next); click(en.next);
  const user=userEvent.setup();
  const target=screen.getByRole('link',{name:en.tryControls});
  target.focus(); await user.keyboard('{Enter}');
  expect(settings(en.configureLab)).toHaveAttribute('aria-expanded','true');
  const cache=screen.getByRole('checkbox',{name:en.cacheEnabled});
  expect(cache).toHaveFocus(); expect(cache).not.toBeChecked();
  const help=screen.getByRole('button',{name:[en.help,en.cacheEnabled,en.configTitle].join(' · ')});
  help.focus(); await user.keyboard('{Enter}{Escape}');
  expect(help).toHaveFocus(); expect(help).toHaveAttribute('aria-expanded','false');
  expect(cache).not.toBeChecked();
});

it('preserves paused backlog and pending capacity through configuration, reference and locale changes',()=>{
  vi.useFakeTimers(); openPhone();
  fireEvent.change(screen.getByLabelText(en.scenario),{target:{value:'autoScaleRecovery'}});
  click(en.play); tick(2000); click(en.pause);
  const gauge=(label:string)=>screen.getByText(label,{selector:'dt'}).nextElementSibling?.textContent;
  const waiting=gauge(en.waiting);
  expect(Number(waiting)).toBeGreaterThan(0);
  expect(gauge(en.admissionSlots)).toBe('3');
  expect(gauge(en.pending)).toBe('1');
  fireEvent.click(settings(en.configureLab)); fireEvent.click(settings(en.configureLab));
  click('Español');
  fireEvent.change(screen.getByLabelText(es.depth),{target:{value:'technical'}});
  fireEvent.click(screen.getByRole('link',{name:es.rejected503}));
  tick(3000); fireEvent.click(screen.getByRole('link',{name:es.experiment}));
  expect(gauge(es.waiting)).toBe(waiting);
  expect(gauge(es.pending)).toBe('1');
  expect(gauge(es.rejected429)).toBe('0');
  expect(Number(gauge(es.rejected503))).toBeGreaterThan(0);
  click(es.resume); tick(2000);
  expect(gauge(es.activeInstances)).toBe('2');
  expect(gauge(es.pending)).toBe('0');
  expect(gauge(es.admissionSlots)).toBe('6');
});
