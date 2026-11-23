import type { SimulationState } from './types';

export function refillBucket(limiter: SimulationState['limiter'], nowMs: number, rate: number): SimulationState['limiter'] {
  return { tokens: Math.min(rate, limiter.tokens + (nowMs - limiter.refilledAtMs) * rate / 1000), refilledAtMs: nowMs };
}
