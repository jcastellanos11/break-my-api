import { describe, expect, it } from 'vitest';
import { validateConfig } from './config';
import { EVENT_LIMIT, getSimulationSnapshot, HISTORY_LIMIT, percentile95 } from './metrics';
import { presets } from './presets';
import { advanceSimulation, configureSimulation, createSimulation, resetSimulation, setActiveInstanceCount } from './simulation';
import type { SimulationConfig, SimulationState } from './types';

const config = (patch: Partial<SimulationConfig> = {}): SimulationConfig => ({ ...presets.healthy, ...patch });
function run(configuration: SimulationConfig, duration = 10_000): SimulationState {
  let state = createSimulation(configuration);
  for (let ms = 0; ms < duration; ms += 50) state = advanceSimulation(state, Math.min(50, duration - ms));
  return state;
}
function conserved(state: SimulationState) {
  expect(state.counters.arrivals).toBe(state.counters.completed200 + state.counters.rejected429 + state.counters.rejected503 + state.waiting.length + state.processing.length + state.cachePending.length);
  for (const count of Object.values(state.counters)) expect(Number.isFinite(count) && count >= 0).toBe(true);
  for (const item of [...state.processing, ...state.cachePending]) expect(item.finishAtMs).toBeGreaterThanOrEqual(item.startedAtMs);
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

describe('configuration and boundaries', () => {
  it.each(Object.entries(presets))('%s matches approved constants and validates', (_, preset) => {
    expect(validateConfig(preset)).toEqual([]);
    conserved(run(preset));
  });
  it.each([
    { incomingRps: 9 }, { incomingRps: 501 }, { incomingRps: NaN }, { incomingRps: 10.5 },
    { instanceCount: 0 }, { instanceCount: 9 }, { concurrencyPerInstance: 0 }, { concurrencyPerInstance: 21 },
    { processingTimeMs: 49 }, { processingTimeMs: 1001 }, { maxQueueSize: -1 }, { maxQueueSize: 1001 },
    { configuredCacheHitRate: -0.1 }, { configuredCacheHitRate: 1.1 }, { configuredCacheHitRate: Infinity },
    { rateLimitRps: 9 }, { rateLimitRps: 501 }, { seed: -1 }, { seed: 2 ** 32 }, { maxInstances: 1 },
  ])('rejects invalid configuration %o', (patch) => {
    expect(validateConfig(config(patch)).length).toBeGreaterThan(0);
    expect(() => createSimulation(config(patch))).toThrow(RangeError);
  });
  it('rejects invalid autoscaling flags and noncanonical cache delay even at the runtime boundary', () => {
    expect(validateConfig({ ...config(), autoScalingEnabled: 1 } as unknown as SimulationConfig)).toContainEqual({ field: 'autoScalingEnabled', code: 'boolean' });
    expect(validateConfig({ ...config(), cacheResponseTimeMs: 0 } as unknown as SimulationConfig)).toContainEqual({ field: 'cacheResponseTimeMs', code: 'fixed' });
  });
  it('accepts the maximum workload without exceeding bounded queue and processing capacity', () => {
    const state = run(config({ incomingRps: 500, instanceCount: 8, concurrencyPerInstance: 20, maxQueueSize: 1000 }));
    conserved(state);
    expect(state.processing.length).toBeLessThanOrEqual(160);
    expect(state.waiting.length).toBeLessThanOrEqual(1000);
  });
});

describe('event pipeline and accounting', () => {
  it('keeps healthy traffic stable after warmup without rejections', () => {
    const state = run(presets.healthy);
    expect(state.waiting).toHaveLength(0);
    expect(state.counters.rejected503).toBe(0);
    expect(state.counters.rejected429).toBe(0);
    expect(getSimulationSnapshot(state).window).toMatchObject({ incomingRps: 35, throughputRps: 35, p95Ms: 120 });
  });
  it('conserves each request across many cache/limiter/queue states', () => {
    for (const cacheEnabled of [false, true]) for (const rateLimitEnabled of [false, true]) {
      let state = createSimulation({ ...presets.trafficSpike, cacheEnabled, rateLimitEnabled, rateLimitRps: 30 });
      for (let tick = 0; tick < 200; tick++) {
        state = advanceSimulation(state, 17);
        conserved(state);
        expect(state.waiting.length).toBeLessThanOrEqual(50);
      }
    }
  });
  it('fills the bounded queue then returns 503 at arrival', () => {
    const state = run(presets.trafficSpike);
    expect(state.waiting).toHaveLength(50);
    expect(state.counters.rejected503).toBeGreaterThan(900);
    expect(state.counters.rejected429).toBe(0);
    expect(getSimulationSnapshot(state).window?.throughputRps).toBe(12);
  });
  it('allows more origin completions with additional active capacity', () => {
    const one = run(presets.trafficSpike);
    const two = run({ ...presets.trafficSpike, instanceCount: 2 });
    expect(getSimulationSnapshot(two).window?.throughputRps).toBe(24);
    expect(two.counters.completed200).toBeGreaterThan(one.counters.completed200);
  });
  it('larger waiting rooms delay rejection but do not increase settled throughput', () => {
    const small = run({ ...presets.trafficSpike, maxQueueSize: 5 });
    const large = run({ ...presets.trafficSpike, maxQueueSize: 100 });
    expect(getSimulationSnapshot(small).window?.throughputRps).toBe(getSimulationSnapshot(large).window?.throughputRps);
    expect(large.counters.rejected503).toBeLessThan(small.counters.rejected503);
    expect(getSimulationSnapshot(large).window?.p95Ms).toBeGreaterThan(getSimulationSnapshot(small).window?.p95Ms ?? 0);
  });
  it('uses completion-before-arrival ordering at identical timestamps with no queue', () => {
    const state = run(config({ incomingRps: 10, instanceCount: 1, concurrencyPerInstance: 1, processingTimeMs: 100, maxQueueSize: 0 }), 300);
    expect(state.counters.rejected503).toBe(0);
    expect(state.events.filter((event) => event.atMs === 200).map((event) => event.kind)).toEqual(['completed200', 'arrival', 'origin_start']);
  });
  it('retains FIFO admission and includes actual queue wait in successful latency', () => {
    const state = run(config({ incomingRps: 20, instanceCount: 1, concurrencyPerInstance: 1, processingTimeMs: 100, maxQueueSize: 5 }), 250);
    expect(state.events.filter((event) => event.kind === 'origin_start').map((event) => event.requestId)).toEqual([1, 2, 3]);
    expect(state.events.filter((event) => event.kind === 'completed200').map((event) => event.latencyMs)).toEqual([100, 150]);
    expect(state.events.find((event) => event.kind === 'origin_start' && event.requestId === 3)?.queueWaitMs).toBe(100);
  });
  it('no waiting room returns 503, never 429 with limiter disabled', () => {
    const state = run({ ...presets.trafficSpike, maxQueueSize: 0 });
    expect(state.waiting).toHaveLength(0);
    expect(state.counters.rejected503).toBeGreaterThan(0);
    expect(state.counters.rejected429).toBe(0);
  });
});

describe('cache and token bucket', () => {
  it('disabled cache produces zero hits even at configured probability 1', () => {
    expect(run(config({ configuredCacheHitRate: 1 })).counters.cacheHits).toBe(0);
  });
  it('100% cache uses no origin slots and schedules completion exactly 10ms later', () => {
    const settings = config({ incomingRps: 10, cacheEnabled: true, configuredCacheHitRate: 1 });
    let state = advanceSimulation(createSimulation(settings), 100);
    expect(state.cachePending).toHaveLength(1);
    expect(state.counters.completed200).toBe(0);
    state = advanceSimulation(state, 9);
    expect(state.counters.completed200).toBe(0);
    state = advanceSimulation(state, 1);
    expect(state.counters.completed200).toBe(1);
    expect(state.currentBucket.latenciesMs).toEqual([10]);
    expect(state.processing).toHaveLength(0);
    expect(state.counters.originStarts).toBe(0);
    conserved(state);
  });
  it('cache rescue reduces origin demand but retains overload with the approved seed', () => {
    const spike = run(presets.trafficSpike, 20_000);
    const rescue = run(presets.cacheRescue, 20_000);
    expect(rescue.counters.cacheHits).toBeGreaterThan(0);
    expect(rescue.counters.rejected503).toBeGreaterThan(0);
    expect(rescue.counters.rejected503).toBeLessThan(spike.counters.rejected503);
    expect(rescue.counters.completed200).toBeGreaterThan(spike.counters.completed200);
  });
  it('starts full, refills and rejects before eligible cache admission', () => {
    const settings = config({ incomingRps: 100, rateLimitEnabled: true, rateLimitRps: 10, cacheEnabled: true, configuredCacheHitRate: 1 });
    const state = run(settings, 1000);
    // 10 initial tokens + 9.9 tokens since first arrival; 19 admitted.
    expect(state.counters.admitted).toBe(19);
    expect(state.counters.rejected429).toBe(81);
    expect(state.counters.cacheHits).toBe(19);
    expect(state.counters.rejected503).toBe(0);
    expect(state.counters.originStarts).toBe(0);
    expect(run(settings, 2000).counters.admitted).toBe(29);
  });
  it('observed hit rate uses admission cohorts; success rate counts only completions', () => {
    const state = run(config({ incomingRps: 10, cacheEnabled: true, configuredCacheHitRate: 1 }), 1000);
    expect(getSimulationSnapshot(state).window).toMatchObject({ startMs: 0, endMs: 1000, incomingRps: 9, throughputRps: 9, observedCacheHitRate: 1, p95Ms: 10 });
    expect(state.counters.arrivals).toBe(10);
    expect(state.cachePending).toHaveLength(1);
  });
});

describe('replay, metrics and time', () => {
  it('replays identical configurations, edits and advance sequences exactly', () => {
    const replay = () => {
      let state = createSimulation(presets.cacheRescue);
      for (const delta of [17, 80, 1000, 390, 2015]) state = advanceSimulation(state, delta);
      state = configureSimulation(state, { ...state.config, rateLimitEnabled: true, rateLimitRps: 20 });
      return advanceSimulation(state, 2400);
    };
    expect(replay()).toEqual(replay());
    expect(getSimulationSnapshot(replay())).toEqual(getSimulationSnapshot(replay()));
  });
  it('is independent of render-sized time chunks', () => {
    const whole = advanceSimulation(createSimulation(presets.cacheRescue), 10_000);
    expect(run(presets.cacheRescue)).toEqual(whole);
  });
  it('never mutates earlier states, including at bucket rollover and config edits', () => {
    const state = deepFreeze(run(presets.cacheRescue, 950));
    expect(() => advanceSimulation(state, 2000)).not.toThrow();
    expect(() => configureSimulation(state, { ...state.config, maxQueueSize: 0 })).not.toThrow();
    expect(state.nowMs).toBe(950);
  });
  it('pause/advance zero freezes the complete state; reset clears and reproduces it', () => {
    const state = run(presets.cacheRescue);
    expect(advanceSimulation(state, 0)).toBe(state);
    const reset = resetSimulation(state.config);
    expect(reset).toEqual(createSimulation(presets.cacheRescue));
    expect(advanceSimulation(reset, 10_000)).toEqual(state);
  });
  it.each([-1, NaN, Infinity, 60_001])('rejects invalid time delta %s', (delta) => {
    expect(() => advanceSimulation(createSimulation(presets.healthy), delta)).toThrow(RangeError);
  });
  it('calculates nearest-rank p95, including empty and singleton samples', () => {
    expect(percentile95([])).toBeNull();
    expect(percentile95([8])).toBe(8);
    expect(percentile95(Array.from({ length: 20 }, (_, i) => 20 - i))).toBe(19);
    expect(getSimulationSnapshot(createSimulation(presets.healthy)).window).toBeNull();
    const state = run(config({ incomingRps: 10, processingTimeMs: 1000 }), 1000);
    expect(getSimulationSnapshot(state).window?.p95Ms).toBeNull();
  });
  it('buckets count rejects at arrival and successes at completion, with explicit half-open boundaries', () => {
    const state = run(config({ incomingRps: 10, instanceCount: 3, processingTimeMs: 1000 }), 2000);
    expect(state.history.map((b) => [b.arrivals, b.completed200])).toEqual([[9, 0], [10, 9]]);
    expect(getSimulationSnapshot(state).window).toMatchObject({ startMs: 1000, endMs: 2000, p95Ms: 1000 });
  });
  it('bounds history, transient events and latency samples under prolonged maximum load', () => {
    let state = createSimulation({ ...presets.trafficSpike, incomingRps: 500, cacheEnabled: true });
    for (let i = 0; i < 3; i++) state = advanceSimulation(state, 60_000);
    conserved(state);
    expect(state.history).toHaveLength(HISTORY_LIMIT);
    expect(state.events).toHaveLength(EVENT_LIMIT);
    expect(state.history[0]?.startMs).toBe(60_000);
    for (const bucket of state.history) expect(bucket.latenciesMs.length).toBeLessThanOrEqual(520);
    expect(state.cachePending.length).toBeLessThanOrEqual(6);
  });
});

describe('safe configuration and capacity changes', () => {
  it('retains running finish times when service time or capacity decreases', () => {
    const before = run({ ...presets.trafficSpike, instanceCount: 2 }, 100);
    const changed = configureSimulation(before, { ...before.config, instanceCount: 1, concurrencyPerInstance: 1, processingTimeMs: 1000, maxQueueSize: 0 });
    expect(changed.processing).toEqual(before.processing);
    expect(changed.waiting).toEqual(before.waiting);
    const after = advanceSimulation(changed, 250);
    conserved(after);
    expect(after.counters.completed200).toBe(6);
    expect(after.processing).toHaveLength(1);
    expect(after.processing[0]?.finishAtMs).toBe(1300);
    expect(after.counters.rejected503).toBeGreaterThan(0);
  });
  it('fills new capacity immediately with oldest queued requests, preserving pending completions', () => {
    const before = run(presets.trafficSpike, 200);
    const changed = setActiveInstanceCount(before, 2);
    expect(changed.processing.slice(0, 3)).toEqual(before.processing);
    expect(changed.processing.slice(3).map((r) => r.id)).toEqual(before.waiting.slice(0, 3).map((r) => r.id));
    expect(changed.processing.slice(3).every((r) => r.startedAtMs === 200)).toBe(true);
    conserved(changed);
    expect(advanceSimulation(changed, 1000).effectiveInstanceCount).toBe(2);
  });
  it('allows pending cache successes after cache is disabled', () => {
    const before = run(config({ incomingRps: 10, cacheEnabled: true, configuredCacheHitRate: 1 }), 100);
    const changed = configureSimulation(before, { ...before.config, cacheEnabled: false });
    const after = advanceSimulation(changed, 10);
    expect(after.counters.completedCacheHits).toBe(1);
    expect(after.counters.completed200).toBe(1);
  });
  it('restarts arrival phase on rate edits without changing historical counters', () => {
    const before = run(presets.healthy, 500);
    const changed = configureSimulation(before, { ...before.config, incomingRps: 10 });
    expect(changed.nextArrivalAtMs).toBe(600);
    expect(changed.counters).toEqual(before.counters);
    expect(advanceSimulation(changed, 100).counters.arrivals).toBe(before.counters.arrivals + 1);
  });
  it('re-enabling limiter starts full; changing rate clamps settled tokens without replenishing a burst', () => {
    let state = run(config({ incomingRps: 500, rateLimitEnabled: true, rateLimitRps: 10 }), 100);
    expect(state.limiter.tokens).toBeLessThan(1);
    state = configureSimulation(state, { ...state.config, rateLimitRps: 20 });
    expect(state.limiter.tokens).toBeLessThan(1);
    state = configureSimulation(state, { ...state.config, rateLimitEnabled: false });
    state = configureSimulation(state, { ...state.config, rateLimitEnabled: true });
    expect(state.limiter.tokens).toBe(20);
  });
  it('rejects seed edits without reset and invalid active capacity', () => {
    const state = createSimulation(presets.healthy);
    expect(() => configureSimulation(state, { ...state.config, seed: 100 })).toThrow(RangeError);
    for (const count of [0, 9, NaN, 1.5]) expect(() => setActiveInstanceCount(state, count)).toThrow(RangeError);
  });
});
