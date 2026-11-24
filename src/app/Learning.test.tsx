// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n/I18nProvider';
import { useI18n } from '../i18n/context';
import { en } from '../i18n/en';
import { es } from '../i18n/es';
import { useSimulation } from './useSimulation';
import { getSimulationSnapshot } from '../engine';
import { Learning } from './Learning';
import { App } from './App';
import { terms } from './insights';

afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();});
const click=(name:string)=>fireEvent.click(screen.getByRole('button',{name}));
const show=()=>render(<I18nProvider><App/></I18nProvider>);
it('keeps the illustrative exchange local and restores focus after navigation',()=>{
  const fetch=vi.fn(), xhr=vi.fn();
  vi.stubGlobal('fetch',fetch); vi.stubGlobal('XMLHttpRequest',xhr);
  show(); click(en.tour); click(en.send);
  expect(screen.getByText(en.takeaway)).toBeVisible();
  expect(screen.getByText(en.clock+' · 0 s')).toBeVisible();
  expect(screen.getByText(en.completed200,{selector:'dt'}).nextElementSibling).toHaveTextContent('0');
  click(en.next); click(en.back); click(en.next); click(en.next);
  expect(screen.getByText(en.tryControls)).toHaveAttribute('href','#capacity-controls');
  click(en.restart); expect(screen.getByText(en.one)).toHaveFocus();
  click(en.skipTour); expect(screen.getByRole('button',{name:en.tour})).toHaveFocus();
  click(en.tour); click(en.close); expect(screen.queryByText(en.one)).toBeNull();
  expect(fetch).not.toHaveBeenCalled(); expect(xhr).not.toHaveBeenCalled();
});
it('applies the actual reset only on explicit lesson action',()=>{
  vi.useFakeTimers();show();click(en.play);act(()=>vi.advanceTimersByTime(2000));
  click(en.tour);click(en.next);
  expect(screen.getByText(en.clock+' · 2 s')).toBeVisible();
  expect(screen.getByLabelText(en.scenario)).toHaveValue('healthy');
  click(en.apply);
  expect(screen.getByLabelText(en.scenario)).toHaveValue('trafficSpike');
  expect(screen.getByText(en.clock+' · 0 s')).toBeVisible();
  act(()=>vi.advanceTimersByTime(2000));
  expect(screen.getByText(en.clock+' · 0 s')).toBeVisible();
});
it('preserves the identical pending model and timer across depth, locale, step and glossary changes',()=>{
  vi.useFakeTimers();
  const schedule=vi.spyOn(window,'setInterval');
  let controller!: ReturnType<typeof useSimulation>;
  function Harness(){
    controller=useSimulation();
    const {setLocale}=useI18n();
    return <><button onClick={()=>setLocale('es')}>ES</button><Learning model={controller.model} snapshot={getSimulationSnapshot(controller.model)} applySpike={()=>{}}/></>;
  }
  render(<I18nProvider><Harness/></I18nProvider>);
  act(()=>{controller.dispatch({type:'select',preset:'autoScaleRecovery'});controller.dispatch({type:'toggle'});});
  act(()=>vi.advanceTimersByTime(2000));
  const pending=controller.model;
  expect(pending.scaling.readyAt).toBe(4000);
  click(en.tour);click(en.next);click(en.next);
  fireEvent.change(screen.getByLabelText(en.depth),{target:{value:'technical'}});
  fireEvent.click(screen.getByText(en.gloss));
  fireEvent.change(screen.getByLabelText(en.term),{target:{value:'p95'}});
  click('ES');
  expect(screen.getByText(es.three)).toBeVisible();
  expect(screen.getByLabelText(es.depth)).toHaveValue('technical');
  expect(screen.getByText(es.defp95Tech)).toBeVisible();
  expect(controller.model).toBe(pending);
  expect(controller.status).toBe('running');
  expect(schedule).toHaveBeenCalledTimes(1);
  act(()=>controller.dispatch({type:'toggle'}));
  fireEvent.change(screen.getByLabelText(es.depth),{target:{value:'simple'}});
  expect(controller.model).toBe(pending);
  act(()=>vi.advanceTimersByTime(2000));
  expect(controller.model).toBe(pending);
});
it('defines all twenty glossary concepts at both depths in both languages',()=>{
  expect(new Set(terms).size).toBe(20);
  for(const t of [en,es]) for(const k of terms){
    expect(t[`def${k}Simple`]).not.toBe(t[`def${k}Tech`]);
    expect(t[`def${k}Term`].length).toBeGreaterThan(0);
  }
});
