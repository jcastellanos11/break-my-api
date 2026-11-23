import { expect, it } from 'vitest';
import { createSimulation, advanceSimulation as step, configureSimulation as edit, presets } from './index';
const recovery = presets.autoScaleRecovery;
it('requires two pressure windows, provisions after 2s, and spaces decisions by 5s', () => {
  let state = step(createSimulation(recovery),1999);
  expect(state.scaling.events).toHaveLength(0);
  state = step(state,1);
  expect(state.scaling.readyAt).toBe(4000);
  state = step(state,1999);
  expect(state.effectiveInstanceCount).toBe(1);
  state = step(state,1);
  expect(state.processing).toHaveLength(6);
  state = step(state,3000);
  expect(state.scaling.events.map(e=>[e.atMs,e.kind])).toEqual([[2000,'scheduled'],[4000,'activated'],[7000,'scheduled']]);
  expect(state).toEqual(step(createSimulation(recovery),7000));
});
it('bounds scale-out on overflow without a queue and cancels pending launches', () => {
  const state = step(createSimulation({...recovery,maxQueueSize:0,maxInstances:2}),2000);
  expect(state.scaling.readyAt).toBe(4000);
  const off = edit(state,{...state.config,autoScalingEnabled:false});
  expect(step(off,10000).effectiveInstanceCount).toBe(1);
  const capped = step(state,30000);
  expect(capped.effectiveInstanceCount).toBe(2);
  expect(capped.scaling.events).toHaveLength(2);
});
it('waits for continuous idle demand, then removes one at a time down to baseline', () => {
  let state = step(createSimulation(recovery),20000);
  expect(state.effectiveInstanceCount).toBeGreaterThan(1);
  state = edit(state,{...state.config,incomingRps:10,processingTimeMs:50});
  expect(step(state,9999).effectiveInstanceCount).toBe(state.effectiveInstanceCount);
  state = step(state,60000);
  expect(state.scaling.events.some(e=>e.kind==='removed')).toBe(true);
  expect(state.effectiveInstanceCount).toBe(1);
  expect(state.counters.arrivals).toBe(state.counters.completed200+state.counters.rejected503+state.processing.length);
});
it('defers the return to manual capacity until running requests fit', () => {
  const state = step(createSimulation(recovery),4000);
  const off = edit(state,{...state.config,autoScalingEnabled:false});
  expect(off.processing).toEqual(state.processing);
  expect(off.effectiveInstanceCount).toBe(2);
  expect(step(off,300).effectiveInstanceCount).toBe(1);
});
it('ignores a single pressure window and busy periods between idle evaluations', () => {
  let state = step(createSimulation({...recovery,maxQueueSize:0}),750);
  state = edit(state,{...state.config,incomingRps:10,processingTimeMs:50});
  expect(step(state,5000).scaling.events).toHaveLength(0);

  const expanded = step(createSimulation({...recovery,maxInstances:2}),6000);
  // Two simultaneous requests exceed 25% of six slots. One short busy interval
  // every 100 ms interrupts idle time even if the queue stays empty.
  const intermittent = edit(expanded,{...expanded.config,incomingRps:20,processingTimeMs:75});
  expect(step(intermittent,30000).effectiveInstanceCount).toBe(2);
});
it('recovers throughput after provisioning while retaining earlier overflow', () => {
  const state = step(createSimulation(recovery),45000);
  expect(state.history[1]?.completed200).toBe(12);
  expect(state.history.at(-1)?.completed200).toBe(40);
  expect(state.waiting.length).toBe(0);
  expect(state.counters.rejected503).toBeGreaterThan(0);
  expect(state.history.at(-1)?.rejected503).toBe(0);
});
