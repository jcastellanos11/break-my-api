import type { Counters, MetricBucket, SimulationSnapshot, SimulationState } from './types';

export const HISTORY_LIMIT = 120;
export const EVENT_LIMIT = 240;
export const emptyCounters = (): Counters => ({ arrivals: 0, admitted: 0, completed200: 0, rejected429: 0, rejected503: 0, cacheHits: 0, completedCacheHits: 0, originStarts: 0 });
export function createBucket(startMs: number): MetricBucket {
  return { ...emptyCounters(), startMs, endMs: startMs + 1000, latenciesMs: [], queueWaitsMs: [], queueDepth: 0 };
}
export function percentile95(samples: readonly number[]): number | null {
  if (!samples.length) return null;
  return [...samples].sort((a, b) => a - b)[Math.ceil(samples.length * 0.95) - 1] ?? null;
}
export function getSimulationSnapshot(state: SimulationState): SimulationSnapshot {
  const bucket = state.history.at(-1);
  return {
    nowMs: state.nowMs, counters: { ...state.counters },
    processing: state.processing.length, waiting: state.waiting.length,
    cachePending: state.cachePending.length, effectiveInstanceCount: state.effectiveInstanceCount,
    slots: state.effectiveInstanceCount * state.config.concurrencyPerInstance,
    window: bucket ? {
      startMs: bucket.startMs, endMs: bucket.endMs,
      incomingRps: bucket.arrivals, throughputRps: bucket.completed200,
      rejected429: bucket.rejected429, rejected503: bucket.rejected503,
      p95Ms: percentile95(bucket.latenciesMs),
      meanQueueWaitMs: bucket.queueWaitsMs.length ? bucket.queueWaitsMs.reduce((a, b) => a + b, 0) / bucket.queueWaitsMs.length : null,
      observedCacheHitRate: bucket.admitted ? bucket.cacheHits / bucket.admitted : null,
    } : null,
    history: state.history.map((point) => ({ ...point, latenciesMs: [...point.latenciesMs], queueWaitsMs: [...point.queueWaitsMs] })),
  };
}
