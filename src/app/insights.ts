import type { SimulationState } from '../engine';
export const terms = ['api', 'request', 'response', 'status', 'rps', 'throughput', 'slots', 'latency', 'p95', 'queue', 'cache', 'hit', 'limit', 'reject', 'overflow', 'instance', 'horizontal', 'auto', 'delay', 'cool'] as const;
export type Term = typeof terms[number];
const explanations = {
  pendingWhy:'delay', capWhy:'auto', overflowWhy:'overflow', limitWhy:'reject',
  queueWhy:'queue', cacheWhy:'hit', removedWhy:'auto', healthyWhy:'throughput', neutral:'rps',
} as const;
export type Insight = keyof typeof explanations;
export const technicalTerm = (key: Insight) => explanations[key];

export function insights(state: SimulationState): Insight[] {
  const last = state.history.at(-1);
  if (!last) return ['neutral'];
  const result: Insight[] = [];
  if (state.scaling.readyAt !== null) result.push('pendingWhy');
  if (state.config.autoScalingEnabled && state.effectiveInstanceCount === state.config.maxInstances &&
      (last.queueDepth || last.rejected503) && (state.waiting.length || state.currentBucket.rejected503)) result.push('capWhy');
  if (last.rejected503) result.push('overflowWhy');
  if (last.rejected429) result.push('limitWhy');
  if (state.waiting.length && last.queueDepth && state.history.at(-2)?.queueDepth) result.push('queueWhy');
  if (state.scaling.events.some(e=>e.kind==='removed' && e.atMs>=last.startMs && e.atMs<last.endMs)) result.push('removedWhy');
  if (last.completedCacheHits) result.push('cacheWhy');
  if (last.completed200 && !last.rejected429 && !last.rejected503 && !last.queueDepth &&
      !state.waiting.length && !last.queueWaitsMs.some(ms=>ms>0)) result.push('healthyWhy');
  return result.length ? result : ['neutral'];
}
