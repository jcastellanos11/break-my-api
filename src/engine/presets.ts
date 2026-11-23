import type { SimulationConfig } from './types';

const base: SimulationConfig = {
  incomingRps: 35, instanceCount: 2, concurrencyPerInstance: 4,
  processingTimeMs: 120, maxQueueSize: 60, cacheEnabled: false,
  configuredCacheHitRate: 0.8, cacheResponseTimeMs: 10,
  rateLimitEnabled: false, rateLimitRps: 60, autoScalingEnabled: false,
  maxInstances: 8, seed: 42,
};

/** Auto Scale Recovery is intentionally added with its policy in P1.4. */
export const presets = {
  healthy: { ...base },
  trafficSpike: { ...base, incomingRps: 120, instanceCount: 1, concurrencyPerInstance: 3, processingTimeMs: 250, maxQueueSize: 50 },
  cacheRescue: { ...base, incomingRps: 120, instanceCount: 1, concurrencyPerInstance: 3, processingTimeMs: 250, maxQueueSize: 50, cacheEnabled: true },
} satisfies Record<string, SimulationConfig>;
export type PresetId = keyof typeof presets;
