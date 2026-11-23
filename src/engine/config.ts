import type { SimulationConfig } from './types';

export type ConfigIssue = { readonly field: keyof SimulationConfig; readonly code: 'range' | 'integer' | 'boolean' | 'fixed' | 'deferred' };

/** Structured errors are ready for localization by the future controls. */
export function validateConfig(config: SimulationConfig): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const integerRanges = {
    incomingRps: [10, 500], instanceCount: [1, 8], concurrencyPerInstance: [1, 20],
    processingTimeMs: [50, 1000], maxQueueSize: [0, 1000], rateLimitRps: [10, 500],
    maxInstances: [config.instanceCount, 8], seed: [0, 0xffffffff],
  } as const;
  for (const field of Object.keys(integerRanges) as (keyof typeof integerRanges)[]) {
    const [min, max] = integerRanges[field];
    const value = config[field];
    if (!Number.isInteger(value)) issues.push({ field, code: 'integer' });
    if (!Number.isFinite(value) || value < min || value > max) issues.push({ field, code: 'range' });
  }
  if (!Number.isFinite(config.configuredCacheHitRate) || config.configuredCacheHitRate < 0 || config.configuredCacheHitRate > 1) {
    issues.push({ field: 'configuredCacheHitRate', code: 'range' });
  }
  for (const field of ['cacheEnabled', 'rateLimitEnabled'] as const) {
    if (typeof config[field] !== 'boolean') issues.push({ field, code: 'boolean' });
  }
  if (config.cacheResponseTimeMs !== 10) issues.push({ field: 'cacheResponseTimeMs', code: 'fixed' });
  if (config.autoScalingEnabled !== false) issues.push({ field: 'autoScalingEnabled', code: 'deferred' });
  return issues;
}

export function assertConfig(config: SimulationConfig): void {
  const issues = validateConfig(config);
  if (issues.length) throw new RangeError(JSON.stringify(issues));
}
