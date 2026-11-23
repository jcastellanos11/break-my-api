import type { initialScaling } from './autoscaling';
/** Domain types contain codes, never localized presentation strings. */
export interface SimulationConfig {
  readonly incomingRps: number;
  readonly instanceCount: number;
  readonly concurrencyPerInstance: number;
  readonly processingTimeMs: number;
  readonly maxQueueSize: number;
  readonly cacheEnabled: boolean;
  /** Engine permits 1 for invariant tests; future UI must cap at 0.8. */
  readonly configuredCacheHitRate: number;
  readonly cacheResponseTimeMs: 10;
  readonly rateLimitEnabled: boolean;
  readonly rateLimitRps: number;
  readonly autoScalingEnabled: boolean;
  readonly maxInstances: number;
  readonly seed: number;
}

export interface RequestRecord {
  readonly id: number;
  readonly arrivedAtMs: number;
}
export interface ScheduledRequest extends RequestRecord {
  readonly startedAtMs: number;
  readonly finishAtMs: number;
}
export type EventKind = 'arrival' | 'queued' | 'origin_start' | 'cache_hit' | 'completed200' | 'rejected429' | 'rejected503';
export interface SimulationEvent {
  readonly atMs: number;
  readonly requestId: number;
  readonly kind: EventKind;
  readonly source?: 'origin' | 'cache';
  readonly latencyMs?: number;
  readonly queueWaitMs?: number;
}
export interface Counters {
  arrivals: number;
  admitted: number;
  completed200: number;
  rejected429: number;
  rejected503: number;
  cacheHits: number;
  completedCacheHits: number;
  originStarts: number;
}
export interface MetricBucket extends Counters {
  readonly startMs: number;
  readonly endMs: number;
  readonly latenciesMs: readonly number[];
  readonly queueWaitsMs: readonly number[];
  queueDepth: number;
}
export interface SimulationState {
  readonly scaling: ReturnType<typeof initialScaling>;
  readonly config: SimulationConfig;
  readonly nowMs: number;
  readonly randomState: number;
  readonly nextArrivalAtMs: number;
  readonly arrivalEpochMs: number;
  readonly arrivalIndex: number;
  readonly nextRequestId: number;
  /** Capacity seam for P1.4: scheduler uses this, independent of policy. */
  readonly effectiveInstanceCount: number;
  readonly limiter: { readonly tokens: number; readonly refilledAtMs: number };
  readonly waiting: readonly RequestRecord[];
  readonly processing: readonly ScheduledRequest[];
  readonly cachePending: readonly ScheduledRequest[];
  readonly counters: Readonly<Counters>;
  readonly currentBucket: MetricBucket;
  readonly history: readonly MetricBucket[];
  readonly events: readonly SimulationEvent[];
}
export interface SimulationSnapshot {
  readonly nowMs: number;
  readonly counters: Readonly<Counters>;
  readonly processing: number;
  readonly waiting: number;
  readonly cachePending: number;
  readonly effectiveInstanceCount: number;
  readonly slots: number;
  /** Latest completed one-second bucket; null before the first second. */
  readonly window: {
    readonly startMs: number;
    readonly endMs: number;
    readonly incomingRps: number;
    readonly throughputRps: number;
    readonly rejected429: number;
    readonly rejected503: number;
    readonly p95Ms: number | null;
    readonly meanQueueWaitMs: number | null;
    /** HIT decisions / admitted eligible GETs, both by admission timestamp. */
    readonly observedCacheHitRate: number | null;
  } | null;
  readonly history: readonly MetricBucket[];
}
