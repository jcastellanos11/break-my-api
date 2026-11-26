// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { advanceSimulation, createSimulation, presets } from '../engine';
import { en } from '../i18n/en';
import { es } from '../i18n/es';
import { I18nProvider } from '../i18n/I18nProvider';
import { App } from './App';

function open() {
  history.replaceState(null, '', '/playground');
  render(<I18nProvider><App/></I18nProvider>);
}
const flow = (name:string = en.flowTitle) => screen.getByRole('region',{name});
const press = (name:string) => fireEvent.click(screen.getByRole('button',{name}));
const tick = (ms:number) => act(()=>vi.advanceTimersByTime(ms));
const edit = (name:string, value:string) => fireEvent.change(screen.getByLabelText(name),{target:{value}});
const branchCount = (name:string) => within(flow()).getByRole('link',{name}).nextElementSibling?.textContent;
afterEach(()=>{cleanup();history.replaceState(null,'','/');vi.useRealTimers();vi.unstubAllGlobals();});

it.each(['healthy','trafficSpike','cacheRescue'] as const)('maps completed responses and current gauges for %s', preset=>{
  vi.useFakeTimers(); open(); edit(en.scenario,preset);
  expect(branchCount(en.flowDone)).toContain('—');
  press(en.play); tick(5250);
  const state = advanceSimulation(createSimulation(presets[preset]),5250);
  const bucket = state.history.at(-1)!;
  expect(flow()).toHaveTextContent(en.window+' · 4–5 s');
  expect(branchCount(en.flowDone)).toBe(en.flowWindow+' · '+(bucket.completed200-bucket.completedCacheHits));
  expect(branchCount(en.flowHit)).toBe(en.flowWindow+' · '+bucket.completedCacheHits);
  expect(branchCount(en.flowLimited)).toBe(en.flowWindow+' · '+bucket.rejected429);
  expect(branchCount(en.flowFull)).toBe(en.flowWindow+' · '+bucket.rejected503);
  expect(flow()).toHaveTextContent(en.flowWait+' '+state.waiting.length+' / '+state.config.maxQueueSize);
  expect(flow()).toHaveTextContent(en.flowBusy+' '+state.processing.length+' / '+state.effectiveInstanceCount*state.config.concurrencyPerInstance);
});

it('keeps accepted work visible above a lowered queue limit and distinguishes limiter rejection',()=>{
  vi.useFakeTimers(); open(); edit(en.scenario,'trafficSpike'); press(en.play); tick(2000); press(en.pause);
  edit(en.maxQueueSize,'0');
  expect(flow()).toHaveTextContent(en.flowWait+' 50 / 0');
  expect(flow()).toHaveTextContent(en.flowDrain);
  fireEvent.click(screen.getByLabelText(en.rateLimitEnabled)); edit(en.rateLimitRps,'10');
  press(en.resume); tick(2000);
  expect(branchCount(en.flowLimited)).not.toBe(en.flowWindow+' · 0');
  expect(branchCount(en.flowFull)).not.toBe(branchCount(en.flowLimited));
});

it('holds pending capacity through pause, depth, locale and a reference visit until activation',()=>{
  vi.useFakeTimers();
  const scheduled = vi.spyOn(window, 'setInterval');
  const cleared = vi.spyOn(window, 'clearInterval');
  open(); edit(en.scenario,'autoScaleRecovery'); press(en.play); tick(2000); press(en.pause);
  expect(flow()).toHaveTextContent(en.pending+' 1');
  expect(flow()).toHaveTextContent(en.flowBusy+' 3 / 3');
  expect(flow()).toHaveAttribute('data-running','false');
  const before = flow().textContent;
  tick(5000);
  expect(flow().textContent).toBe(before);
  edit(en.depth,'technical'); press('Español');
  fireEvent.click(within(flow(es.flowTitle)).getByRole('link',{name:es.flowFull}));
  fireEvent.click(screen.getByRole('link',{name:es.experiment}));
  expect(flow(es.flowTitle)).toHaveTextContent(es.flowTech);
  expect(flow(es.flowTitle)).toHaveTextContent(es.pending+' 1');
  press(es.resume); tick(1750);
  expect(flow(es.flowTitle)).toHaveTextContent(es.activeInstances+' 1');
  tick(250);
  expect(flow(es.flowTitle)).toHaveTextContent(es.pending+' 0');
  expect(flow(es.flowTitle)).toHaveTextContent(es.flowBusy+' 6 / 6');
  expect(Number(screen.getByText(es.rejected503,{selector:'dt'}).nextElementSibling?.textContent)).toBeGreaterThan(0);
  press(es.reset);
  expect(flow(es.flowTitle)).toHaveTextContent(es.awaitWindow);
  expect(flow(es.flowTitle)).toHaveAttribute('data-running','false');
  // jsdom also schedules frames to repair focus after route changes.
  const clocks = scheduled.mock.results.filter((_, index) => scheduled.mock.calls[index]?.[1] === 250);
  expect(clocks).toHaveLength(2);
  for (const { value } of clocks) expect(cleared).toHaveBeenCalledWith(value);
});

it('renders a fixed set of branches under high demand with reduced motion and no extra clock',()=>{
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia',(query:string)=>({matches:query.includes('reduce') || query.includes('min-width'),addEventListener:vi.fn(),removeEventListener:vi.fn()}));
  open(); edit(en.incomingRps,'500'); press(en.play); tick(1000);
  const elements = flow().querySelectorAll('*').length;
  tick(5000);
  expect(flow().querySelectorAll('*')).toHaveLength(elements);
  expect(flow().querySelectorAll('.flow-meter')).toHaveLength(4);
  expect(flow()).toHaveTextContent('500 '+en.requestsUnit);
  expect(vi.getTimerCount()).toBe(1);
  edit(en.scenario,'healthy');
  expect(branchCount(en.flowFull)).toContain('—');
  expect(vi.getTimerCount()).toBe(0);
});

it('opens stage help with Enter and restores keyboard focus with Escape',async()=>{
  open(); const user=userEvent.setup();
  const button=within(flow()).getByRole('button',{name:[en.help,en.cacheEnabled,en.flowTitle].join(' · ')});
  button.focus(); await user.keyboard('{Enter}');
  expect(within(flow()).getByRole('region',{name:en.cacheEnabled})).toHaveTextContent(en.defcacheSimple);
  await user.keyboard('{Escape}');
  expect(button).toHaveFocus(); expect(button).toHaveAttribute('aria-expanded','false');
  expect(flow()).toHaveAccessibleDescription(en.neutral);
});
