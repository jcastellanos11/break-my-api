# 05 — Deterministic simulation engine + simple auto scaling (approved)

## 1. Modeling goal and fidelity

Simulate a **single synchronous HTTP GET service** in an abstract environment. Requests are synthetic event records **in browser memory**; do not use `fetch` to generate traffic. The model explains cause and effect, not measured production or AWS/Azure capacity. Use a pure, deterministic TypeScript function interface with a simulated clock and seeded RNG.

## 2. Canonical configuration

```ts
type SimulationConfig = {
  incomingRps: number;             // 10..500
  instanceCount: number;           // manual count; autoscale baseline/min, 1..8
  concurrencyPerInstance: number;  // 1..20
  processingTimeMs: number;        // 50..1000 constant at origin start
  maxQueueSize: number;            // 0..1000 waiting only
  cacheEnabled: boolean;
  configuredCacheHitRate: number;  // UI 0..0.8 for all eligible GET
  cacheResponseTimeMs: number;     // fixed 10ms model delay
  rateLimitEnabled: boolean;
  rateLimitRps: number;            // 10..500
  autoScalingEnabled: boolean;     // default false
  maxInstances: number;            // default 8, >= instanceCount, <=8
  seed: number;                    // deterministic, e.g. 42
};
```

Keep `GET /api/products` the only request in MVP, eligible for caching. Extend to request types *only after* MVP if needed. UI presents no advanced scaling editor; policy constants below are source-controlled and disclosed in help.

## 3. State and event pipeline

State includes simulated time, deterministic request schedule/arrival fractional accumulator, PRNG, token-bucket state, FIFO waiting request timestamps, in-flight origin work with completion timestamps, scheduled cache completions, cumulative counters, 1s rolling metrics buckets with latency samples, bounded transient UI events, and autoscale state (active instance count, pending launches, sustained-pressure/idle indicators, last scale decision).

For every request arrival:

1. Record **arrived** event.
2. Apply a deterministic token-bucket **rate limiter** first: refill `rateLimitRps` tokens/s up to bucket capacity `rateLimitRps` (1 second burst), consume one token on admit; reject with **429** otherwise. Token bucket starts full when enabled on a reset. Configuration changes must be deterministic and documented.
3. Apply **cache** if enabled and the GET is eligible; seeded draw against configured HIT probability. On hit, schedule simulated **200** at `arrivalTime + 10ms`; do not use origin/queue slots. On miss continue.
4. **Origin**: if an active processing slot is available, begin processing and schedule 200 at `startedAt + processingTimeMs` (processing time captured **when request starts**, so slider changes cannot rewrite already-running work).
5. Otherwise **FIFO queue**: if waiting room is available, add to waiting queue.
6. If neither origin nor queue accepts it, return simulated **503** on arrival.
7. When a processing request finishes, record success/latency and fill the freed slot from the oldest waiting request immediately at that event time. P95 uses `finish - originalArrival` inclusive of waiting.

At a timestamp tie: process completions first, then waiting-to-processing, then arrivals. Finish scheduled cache responses as model events, not as instantaneous successes. Arrivals should be evenly placed across simulation time instead of all at the tick boundary when practicable.

## 4. Invariants and precise metrics

At any moment, including pending cache responses:

`arrivals = completed200 + rejected429 + rejected503 + waiting + processing + cachePending`.

No request double-counted; no negative or NaN durations; cache hits never occupy origin slots; limiter-rejected arrivals never reach cache; model has bounded scheduled work/history.

Measurements from engine events (for a clearly labeled simulated 1s window or rolling N-second view):

- Incoming RPS = arrival event count / elapsed seconds.
- Successful throughput = completed 200 events / elapsed seconds (origin + cache).
- Rate-limited 429 and queue-overflow 503 reported separately; never claim fewer 503s means more clients served if 429s rose.
- In-flight = processing requests; queue depth = waiting requests; these are instantaneous gauges, **not rates**.
- P95 = nearest-rank percentile of **successful completed** end-to-end durations in observed window (`sorted[ceil(0.95*n)-1]`), shown as `—` if n=0.
- Configured cache HIT *probability* differs from observed HIT *rate*. Count actual hits among limiter-admitted eligible requests using an internally consistent interval definition.
- Theoretical origin capacity is approximately `(effectiveInstanceCount * concurrencyPerInstance) / (processingTimeMs/1000)` only at stable flow and fixed work. Cache successes bypass this origin limit.
- Optional computed slot utilization = `originInFlight / (effectiveInstances * concurrencyPerInstance)`; **never label CPU %**.
- When queue capacity is decreased during a run, previously admitted waiting requests are retained; queue may **temporarily exceed the new limit**, but no new arrivals may enter until below it. The same principle applies when reducing concurrent slots while requests are active.

## 5. Discrete time and deterministic replay

- Suggested internal tick: `50ms` or event scheduler with stable ordering; render at 4–10 frames/sec and cap charts to 60–120 seconds/points.
- Never base simulation measurements on actual network timings or React re-render intervals.
- Use seeded deterministic RNG; same config + seed + sequence of `advance(deltaMs)` calls must yield identical events and snapshots.
- Pause stops simulated time. Reset recreates seed and counters. Large real-world tab-resume gaps must **not** cause huge catch-up processing; cap or pause and inform user.
- Configuration changes affect future admissions/service starts only; accepted processing is not cancelled retroactively.
- Changing language or explanation depth cannot change engine state; visualization and translation are orthogonal.

## 6. Autoscaling (MVP P1.4: **simple and bounded**)

**Do not implement this in P1.2**. P1.2 must make it possible to vary effective capacity safely. P1.4 adds the following one transparent educational policy; no cloud-provider algorithms or CPU metrics.

### Policy defaults (source constants, not advanced UI sliders)

| Setting | Fixed MVP behavior |
|---|---|
| Initial/min instances | `instanceCount` selected before enabling auto scaling |
| Maximum instances | `maxInstances`, default 8; never allow effective + pending above max |
| Evaluation interval | Every 1,000ms of **simulated time** |
| Scale-out signal | Queue nonempty **or** 503 rejections occurring, *persistently* for 2 consecutive evaluation windows |
| Scale-out action | Schedule **+1** instance; only one pending launch at once |
| Provisioning delay | **2,000ms** simulated time after schedule before capacity can process arrivals |
| Cooldown between decisions | **5,000ms** from prior scaling decision; scale-in/out decisions mutually respect it |
| Scale-in signal | Empty queue, no 503, origin slot utilization <=25% continuously for **10,000ms**; no pending instance launch |
| Scale-in action | Remove **at most 1** idle capacity unit at a decision, not below min, **only if** active processing count fits remaining slots |
| Pending launch when autoscale disabled | Cancel pending launches; return toward manual `instanceCount` without discarding accepted work (defer shrink if necessary) |

This policy is a **teaching simplification**, deliberately queue/rejection-driven. It does **not** calculate actual cloud CPU usage, billing or infrastructure startup time. It may still reject arrivals while capacity is provisioning or if max instances remain insufficient. If queue limit=0, sustained 503 provides the overload signal.

### Engine accounting and state transitions

- `effectiveInstanceCount` counts active usable abstract units only; scheduled launches are `pendingInstances` and provide **zero processing slots** until `readyAtMs`.
- At every policy evaluation timestamp: update sustained-pressure/idle signals; apply cooldown/max/min guards; emit events e.g. `scale_out_scheduled`, `scale_out_ready`, `scale_in_completed` with timestamps/reason.
- Never infer scaling outcomes solely from chart aesthetics. Record actual events and display their causes.
- If a scale-out finishes, fill newly freed slots immediately from FIFO queue at that timestamp before new arrivals.
- Scale-in never drops accepted requests: if in-flight exceeds reduced slot capacity, delay removal until safe. If a user manually reduces instances, existing requests are also allowed to finish.
- When user changes `instanceCount` while auto scaling enabled: either disable manual count adjustment in UI or clearly reinitialize the scenario. **Preferred UX:** disable manual instance slider while scaling is on, show live effective instance count and bound `min..max`.
- Reset cancels pending additions and restores config.min count; pause freezes cooldown and provisioning clocks.
- Scaling decisions and counters must be deterministic across replays.

### Clear user-facing teaching point

“Auto scaling is not instantaneous. It can help sustained demand, but cannot always prevent short spikes or eliminate failures.” / “El escalamiento automático no es instantáneo. Puede ayudar ante demanda sostenida, pero no siempre evita picos o fallos.”

## 7. Presets — deterministic teaching scenarios

| Preset | Instances | Slots/unit | Processing | Incoming | Queue | Cache | Limit | Auto scale |
|---|---:|---:|---:|---:|---:|---|---|---|
| Healthy | 2 | 4 | 120ms | 35 RPS | 60 | off | off | off |
| Traffic Spike | 1 | 3 | 250ms | 120 RPS | 50 | off | off | off |
| Cache Rescue | 1 | 3 | 250ms | 120 RPS | 50 | 80% HIT | off | off |
| Auto Scale Recovery | 1 | 3 | 250ms | 40 RPS | 50 | off | off | on, max 8 |

**Calibration:** 3 slots at 250ms yield ~12 origin completions/s. In Traffic Spike at 120 RPS this is badly overloaded. Cache Rescue's expected origin load is about 24 RPS, **still overload**, intentionally. Auto Scale Recovery at 40 RPS can eventually be handled by **4** instances (nominal 48 origin completions/s), so scaling has an intelligible partial-to-recovery story after delays. A faster burst may still overflow the queue before recovery.

## 8. Forbidden fabricated outputs

- “Measured network latency”, fake CPU %, memory, cloud bills, bandwidth, packet counts, unmodeled timeouts/504, non-cacheable cache HITs.
- p95 computed from a guessed mathematical multiplier rather than recorded successful completions.
- Autoscaling depicted as capacity increase **before** provisioning delay, or above max.
- “Cache makes every request faster”, “rate limiting makes everyone succeed”, “autoscaling always eliminates 503s”.

## 9. Suggested module functions

```ts
createSimulation(config: SimulationConfig): SimulationState
advanceSimulation(state: SimulationState, config: SimulationConfig, deltaMs: number): SimulationState
getSimulationSnapshot(state: SimulationState): SimulationSnapshot
resetSimulation(config: SimulationConfig): SimulationState
```

Pure from caller perspective; implementation may use local mutable data while evaluating a tick but must avoid contaminating prior states. Put autoscale policy in isolated `autoscaling.ts` added in P1.4.
