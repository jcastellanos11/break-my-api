// All durations are measured by the simulation clock.
export const policy = { interval: 1000, pressureWindows: 2, provisioning: 2000, cooldown: 5000, idle: 10000 } as const;
export type ScaleKind = 'scheduled' | 'activated' | 'removed' | 'cancelled' | 'manualReturn';
type ScaleEvent = { atMs: number; kind: ScaleKind; active: number };
export function initialScaling(now: number, rejected: number) {
  return {
    evaluationAt: now + policy.interval, previousRejected: rejected, pressure: 0,
    readyAt: null as number | null, lastDecision: null as number | null,
    idleSince: null as number | null, returning: false, events: [] as ScaleEvent[],
  };
}
type Scaling = ReturnType<typeof initialScaling>;
export function recordScale(s: Scaling, now: number, kind: ScaleKind, active: number) {
  s.events = [...s.events.slice(-59), { atMs: now, kind, active }];
}
export function observeIdle(s: Scaling, now: number, empty: boolean, busy: number, slots: number, rejected: boolean) {
  if (rejected) s.idleSince = null;
  if (empty && busy * 4 <= slots && s.readyAt === null) s.idleSince ??= now;
  else s.idleSince = null;
}
// Called on a private scheduler draft. Observe each full policy window once.
export function evaluate(s: Scaling, now: number, waiting: number, rejected: number,
  busy: number, active: number, perInstance: number, min: number, max: number) {
  const pressure = waiting > 0 || rejected > s.previousRejected;
  s.pressure = pressure ? s.pressure + 1 : 0;
  s.previousRejected = rejected;
  s.evaluationAt = now + policy.interval;
  if (s.readyAt !== null || (s.lastDecision !== null && now - s.lastDecision < policy.cooldown)) return active;
  if (s.pressure >= policy.pressureWindows && active < max) {
    s.readyAt = now + policy.provisioning;
    s.lastDecision = now;
    recordScale(s, now, 'scheduled', active);
  } else if (!pressure && s.idleSince !== null && now - s.idleSince >= policy.idle &&
      active > min && busy <= (active - 1) * perInstance) {
    s.lastDecision = now;
    recordScale(s, now, 'removed', active - 1);
    return active - 1;
  }
  return active;
}
