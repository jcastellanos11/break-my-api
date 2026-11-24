import { expect, it } from 'vitest';
import { advanceSimulation as step, configureSimulation as edit, createSimulation, presets } from '../engine';
import { insights } from './insights';

it('waits for a complete second and two backlog observations',()=>{
  const spike=createSimulation(presets.trafficSpike);
  expect(insights(step(spike,999))).toEqual(['neutral']);
  expect(insights(step(spike,1000))).toEqual(['overflowWhy']);
  expect(insights(step(spike,2000))).toEqual(['overflowWhy','queueWhy']);
  expect(insights(step(createSimulation(presets.healthy),3000))).toEqual(['healthyWhy']);
});
it('separates completed cache responses from limiter rejections in the same bucket',()=>{
  const state=createSimulation({...presets.cacheRescue,configuredCacheHitRate:1,rateLimitEnabled:true,rateLimitRps:10});
  expect(insights(step(state,1000))).toEqual(['limitWhy','cacheWhy']);
});
it('prioritizes pending and capped overload only when present',()=>{
  const start=createSimulation({...presets.autoScaleRecovery,maxInstances:2});
  expect(insights(step(start,2000))[0]).toBe('pendingWhy');
  expect(insights(step(start,5000))[0]).toBe('capWhy');
  const quiet=edit(step(start,5000),{...start.config,incomingRps:10,processingTimeMs:50});
  expect(insights(step(quiet,5000))).not.toContain('capWhy');
});
it('reports scale-in only during the completed bucket containing the retirement',()=>{
  const active=step(createSimulation(presets.autoScaleRecovery),10000);
  let current=edit(active,{...active.config,incomingRps:10,processingTimeMs:50});
  while (!current.scaling.events.some(e=>e.kind==='removed') && current.nowMs<60000) current=step(current,1000);
  expect(insights(current)).not.toContain('removedWhy');
  expect(insights(step(current,1000))).toContain('removedWhy');
  expect(insights(step(current,2000))).not.toContain('removedWhy');
});
