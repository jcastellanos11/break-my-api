// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, fireEvent, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { I18nProvider } from '../i18n/I18nProvider';
import { en } from '../i18n/en';
import { es } from '../i18n/es';

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('bilingual foundation shell', () => {
  it('has matching complete dictionary keys and nonempty copy', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
    for (const dictionary of [en, es]) for (const copy of Object.values(dictionary)) expect(copy.trim().length).toBeGreaterThan(0);
  });
  it('switches all rendered copy, accessible descriptions and document language', async () => {
    const user = userEvent.setup();
    render(<I18nProvider><App /></I18nProvider>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.headline);
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Español' }));
    expect(document.documentElement.lang).toBe('es');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(es.headline);
    expect(screen.getByRole('img', { name: es.diagramLabel })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: es.start })).toHaveAttribute('href', '#experiment');
    expect(screen.getByRole('navigation', { name: es.navigation })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: es.language })).toBeInTheDocument();
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      if (en[key] !== es[key]) expect(screen.queryAllByText(en[key], { exact: true })).toHaveLength(0);
    }
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(document.documentElement.lang).toBe('en');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.headline);
  });
  it('preserves the clock, history and running state across language changes and pauses', () => {
    vi.useFakeTimers();
    render(<I18nProvider><App /></I18nProvider>);
    const button = (name: string) => fireEvent.click(screen.getByRole('button',{name}));
    const tick = (ms: number) => act(()=>vi.advanceTimersByTime(ms));
    const series = () => screen.getByRole('table',{hidden:true}).querySelector('tbody')?.textContent;
    expect(screen.getAllByText(en.noData)).toHaveLength(3);
    button(en.play);
    tick(3000);
    const before = series();
    button('Español');
    expect(series()).toBe(before);
    expect(screen.getByText(es.clock+' · 3 s')).toBeInTheDocument();
    button(es.pause);
    tick(4000);
    expect(series()).toBe(before);
    button(es.resume);
    tick(1000);
    expect(series()).not.toBe(before);
    button(es.reset);
    expect(screen.queryByRole('table',{hidden:true})).toBeNull();
    button(es.play);
    tick(3000);
    expect(series()).toBe(before);
  });
  it('applies every control and starts each new preset with clean counters and history', () => {
    vi.useFakeTimers();
    render(<I18nProvider><App /></I18nProvider>);
    const change = (name:string,value:string) => fireEvent.change(screen.getByLabelText(name),{target:{value}});
    change(en.scenario,'trafficSpike');
    fireEvent.click(screen.getByRole('button',{name:en.play}));
    act(()=>vi.advanceTimersByTime(2000));
    const metric = (label:string) => Number(screen.getByText(label,{selector:'dt'}).nextElementSibling?.textContent);
    expect(metric(en.rejected503)).toBeGreaterThan(0);
    expect(metric(en.rejected429)).toBe(0);
    for (const [name,value] of [[en.instanceCount,'2'],[en.concurrencyPerInstance,'5'],[en.maxQueueSize,'0'],[en.processingTimeMs,'750'],[en.incomingRps,'500']] as const) {
      change(name,value);
      expect(screen.getByLabelText(name)).toHaveValue(value);
    }
    expect(metric(en.active)).toBe(10);
    expect(metric(en.waiting)).toBeGreaterThan(0);
    fireEvent.click(screen.getByLabelText(en.cacheEnabled));
    change(en.configuredCacheHitRate,'70');
    fireEvent.click(screen.getByLabelText(en.rateLimitEnabled));
    change(en.rateLimitRps,'10');
    act(()=>vi.advanceTimersByTime(2000));
    expect(metric(en.cacheHits)).toBeGreaterThan(0);
    expect(metric(en.rejected429)).toBeGreaterThan(0);
    change(en.scenario,'cacheRescue');
    expect(screen.getByLabelText(en.configuredCacheHitRate)).toHaveValue('80');
    expect(screen.getByLabelText(en.rateLimitEnabled)).not.toBeChecked();
    expect(metric(en.rejected503)).toBe(0);
    expect(metric(en.cacheHits)).toBe(0);
    expect(screen.queryByRole('table',{hidden:true})).toBeNull();
  });
  it('releases its clock on unmount and skips hidden callbacks', () => {
    vi.useFakeTimers();
    for (let i=0;i<2;i++) {
      const view=render(<I18nProvider><App /></I18nProvider>);
      fireEvent.click(screen.getByRole('button',{name:en.play}));
      expect(vi.getTimerCount()).toBe(1);
      const hidden=vi.spyOn(document,'hidden','get').mockReturnValue(true);
      act(()=>vi.advanceTimersByTime(20000));
      expect(screen.getByText(en.clock+' · 0 s')).toBeInTheDocument();
      hidden.mockRestore();
      view.unmount();
      expect(vi.getTimerCount()).toBe(0);
    }
  });
});
