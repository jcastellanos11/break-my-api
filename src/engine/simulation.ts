import { assertConfig } from './config';
import { createBucket, emptyCounters, EVENT_LIMIT, HISTORY_LIMIT } from './metrics';
import { nextRandom } from './random';
import { refillBucket } from './rateLimiter';
import type { Counters, RequestRecord, ScheduledRequest, SimulationConfig, SimulationEvent, SimulationState } from './types';

// Nanosecond precision in millisecond units avoids cumulative interval drift.
const timestamp = (ms: number): number => Math.round(ms * 1e6) / 1e6;

export function createSimulation(config: SimulationConfig): SimulationState {
  assertConfig(config);
  return {
    config: { ...config }, nowMs: 0, randomState: config.seed,
    nextArrivalAtMs: timestamp(1000 / config.incomingRps), arrivalEpochMs: 0, arrivalIndex: 1,
    nextRequestId: 1, effectiveInstanceCount: config.instanceCount,
    limiter: { tokens: config.rateLimitRps, refilledAtMs: 0 },
    waiting: [], processing: [], cachePending: [], counters: emptyCounters(),
    currentBucket: createBucket(0), history: [], events: [],
  };
}
export const resetSimulation = createSimulation;

function draft(state: SimulationState) {
  return {
    ...state, config: { ...state.config }, limiter: { ...state.limiter },
    counters: { ...state.counters }, waiting: [...state.waiting],
    processing: [...state.processing], cachePending: [...state.cachePending],
    currentBucket: { ...state.currentBucket, latenciesMs: [...state.currentBucket.latenciesMs], queueWaitsMs: [...state.currentBucket.queueWaitsMs] },
    history: [...state.history], events: [...state.events],
  };
}
type Draft = ReturnType<typeof draft>;
function emit(state: Draft, requestId: number, kind: SimulationEvent['kind'], detail: Partial<Pick<SimulationEvent, 'source' | 'latencyMs' | 'queueWaitMs'>> = {}) {
  state.events.push({ atMs: state.nowMs, requestId, kind, ...detail });
  if (state.events.length > EVENT_LIMIT) state.events.shift();
}
function count(state: Draft, key: keyof Counters) {
  state.counters[key]++;
  state.currentBucket[key]++;
}
function startOrigin(state: Draft, request: RequestRecord) {
  const queueWaitMs = timestamp(state.nowMs - request.arrivedAtMs);
  state.processing.push({ ...request, startedAtMs: state.nowMs, finishAtMs: timestamp(state.nowMs + state.config.processingTimeMs) });
  count(state, 'originStarts');
  state.currentBucket.queueWaitsMs.push(queueWaitMs);
  emit(state, request.id, 'origin_start', { queueWaitMs });
}
function fillSlots(state: Draft) {
  const slots = state.effectiveInstanceCount * state.config.concurrencyPerInstance;
  while (state.waiting.length && state.processing.length < slots) {
    const request = state.waiting.shift();
    if (request) startOrigin(state, request);
  }
}
function complete(state: Draft, request: ScheduledRequest, source: 'origin' | 'cache') {
  const latencyMs = timestamp(state.nowMs - request.arrivedAtMs);
  count(state, 'completed200');
  if (source === 'cache') count(state, 'completedCacheHits');
  state.currentBucket.latenciesMs.push(latencyMs);
  emit(state, request.id, 'completed200', { source, latencyMs });
}
function arrive(state: Draft) {
  const request: RequestRecord = { id: state.nextRequestId++, arrivedAtMs: state.nowMs };
  count(state, 'arrivals');
  emit(state, request.id, 'arrival');
  if (state.config.rateLimitEnabled) {
    state.limiter = { ...refillBucket(state.limiter, state.nowMs, state.config.rateLimitRps) };
    if (state.limiter.tokens + 1e-9 < 1) {
      count(state, 'rejected429');
      emit(state, request.id, 'rejected429');
      return;
    }
    state.limiter.tokens = Math.max(0, state.limiter.tokens - 1);
  }
  count(state, 'admitted');
  if (state.config.cacheEnabled) {
    const random = nextRandom(state.randomState);
    state.randomState = random.state;
    if (random.value < state.config.configuredCacheHitRate) {
      count(state, 'cacheHits');
      state.cachePending.push({ ...request, startedAtMs: state.nowMs, finishAtMs: timestamp(state.nowMs + state.config.cacheResponseTimeMs) });
      emit(state, request.id, 'cache_hit');
      return;
    }
  }
  if (state.processing.length < state.effectiveInstanceCount * state.config.concurrencyPerInstance) {
    startOrigin(state, request);
  } else if (state.waiting.length < state.config.maxQueueSize) {
    state.waiting.push(request);
    emit(state, request.id, 'queued');
  } else {
    count(state, 'rejected503');
    emit(state, request.id, 'rejected503');
  }
}

/** Pure event scheduler. Pause is simply no advance (or advance by zero).
 * Explicit calls are bounded to 60s; a future controller must cap tab-resume deltas.
 */
export function advanceSimulation(state: SimulationState, deltaMs: number): SimulationState {
  if (!Number.isFinite(deltaMs) || deltaMs < 0 || deltaMs > 60_000) throw new RangeError('deltaMs must be finite and in [0, 60000]');
  if (deltaMs === 0) return state;
  const next = draft(state);
  const target = timestamp(state.nowMs + deltaMs);
  while (true) {
    const completionAt = Math.min(...next.processing.map((r) => r.finishAtMs), ...next.cachePending.map((r) => r.finishAtMs));
    const at = Math.min(next.nextArrivalAtMs, completionAt, next.currentBucket.endMs);
    if (at > target) break;
    next.nowMs = at;
    // Half-open buckets [start, end): boundary events belong to the next bucket.
    if (at === next.currentBucket.endMs) {
      next.currentBucket.queueDepth = next.waiting.length;
      next.history.push(next.currentBucket);
      if (next.history.length > HISTORY_LIMIT) next.history.shift();
      const bucket = createBucket(at);
      next.currentBucket = { ...bucket, latenciesMs: [], queueWaitsMs: [] };
    }
    const originDone = next.processing.filter((r) => r.finishAtMs <= at);
    const cacheDone = next.cachePending.filter((r) => r.finishAtMs <= at);
    next.processing = next.processing.filter((r) => r.finishAtMs > at);
    next.cachePending = next.cachePending.filter((r) => r.finishAtMs > at);
    // Stable ID order for all simultaneous completions, before any queued work.
    for (const item of [...originDone.map((request) => ({ request, source: 'origin' as const })), ...cacheDone.map((request) => ({ request, source: 'cache' as const }))].sort((a, b) => a.request.id - b.request.id)) {
      complete(next, item.request, item.source);
    }
    fillSlots(next);
    if (next.nextArrivalAtMs === at) {
      arrive(next);
      next.arrivalIndex++;
      next.nextArrivalAtMs = timestamp(next.arrivalEpochMs + next.arrivalIndex * 1000 / next.config.incomingRps);
    }
  }
  next.nowMs = target;
  next.currentBucket.queueDepth = next.waiting.length;
  return next;
}

/** Configuration changes take effect at the current simulated timestamp.
 * Already scheduled origin/cache completions and accepted waiting work survive.
 * Rate changes start a new evenly spaced arrival phase, without catch-up bursts.
 */
export function configureSimulation(state: SimulationState, config: SimulationConfig): SimulationState {
  assertConfig(config);
  if (config.seed !== state.config.seed) throw new RangeError('Changing seed requires resetSimulation');
  const next = draft(state);
  if (config.incomingRps !== state.config.incomingRps) {
    next.arrivalEpochMs = state.nowMs;
    next.arrivalIndex = 1;
    next.nextArrivalAtMs = timestamp(state.nowMs + 1000 / config.incomingRps);
  }
  // Settle old policy before changing cap; re-enabling starts a full bucket.
  const settled = refillBucket(state.limiter, state.nowMs, state.config.rateLimitRps);
  next.limiter = {
    tokens: config.rateLimitEnabled && !state.config.rateLimitEnabled ? config.rateLimitRps : Math.min(config.rateLimitRps, settled.tokens),
    refilledAtMs: state.nowMs,
  };
  next.config = { ...config };
  next.effectiveInstanceCount = config.instanceCount;
  fillSlots(next);
  return next;
}

/** Future policy can call this at an event timestamp; no policy exists in P1.2.
 * A lower target retains in-flight work and blocks new starts until slots free.
 */
export function setActiveInstanceCount(state: SimulationState, count: number): SimulationState {
  if (!Number.isInteger(count) || count < 1 || count > state.config.maxInstances) throw new RangeError('Invalid active instance count');
  const next = draft(state);
  next.effectiveInstanceCount = count;
  fillSlots(next);
  return next;
}
