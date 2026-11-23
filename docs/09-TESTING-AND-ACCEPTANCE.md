# 09 — Automated tests, acceptance and QA (approved)

## A. Engine unit tests — P1.2 core

1. **Conservation:** `arrivals = completed200 + rejected429 + rejected503 + queued + processing + cachePending` at every stable snapshot.
2. **Healthy flow:** rate below origin capacity => near-zero stable queue and no overflow 503 after warmup.
3. **Overload:** sustained high RPS fills queue, then emits 503; queue bounded except documented transient following a UI decrease.
4. **Capacity:** extra active instances increase origin completions under suitable fixed demand when comparing settled windows.
5. **Queue cap:** larger FIFO waiting room does not change theoretical processing throughput.
6. **Reproducibility:** identical seed/config/sequence => identical event log, counters, latencies, snapshots and chart points.
7. **Cache off/on:** 0 HITs when disabled; 100% in internal test bypasses origin entirely; 10ms schedule is honored.
8. **Rate limiter:** disabled => 0 429; enabled => token bucket burst/refill and 429 events before cache admission.
9. **Overflow semantics:** no slot and no waiting room => 503; no fake 429 unless limiter rejects first.
10. **p95:** calculate empirical nearest-rank p95 over real completed successes incl. queue wait; `—` when no completion samples.
11. **Time:** pause prevents changes; reset clears and repeats; events at same timestamp process completions before arrivals.
12. **Boundaries:** zero-length queue, max 500 RPS, 1–8 instances, 1–20 slots, dynamically lowered capacity, no NaN/negative values.
13. **Rolling metrics:** 1s bucket counts and bounded chart history; count rejects on event and successes at completion.
14. **Pure state:** engine does not make network calls, read browser locale or depend on wall-clock time.

## B. Autoscale tests — P1.4

1. Without auto scaling, instance count never changes unless user config explicitly changes.
2. A brief overload shorter than the sustained threshold must **not** schedule a new instance.
3. Sustained pressure schedules exactly one +1 under policy rules and has an explicit event.
4. The effective count does **not** increase until provisioning delay is complete; pending count is visible.
5. After activation, new capacity processes existing queue immediately at model event time.
6. Cooldown prevents rapid repeated decisions and policy never exceeds `maxInstances` including pending.
7. At max, overload/503 can continue; UI avoids success guarantees.
8. After 10s true low demand, policy may scale in by one, never below `instanceCount` min.
9. In-flight work is never cancelled or moved backward to force scale-in; if insufficient free capacity, scale-in waits.
10. Pause freezes provisioning/cooldowns, reset returns to baseline, disable cancels pending but preserves accepted work.
11. Autoscaling replay with same seed/time/config generates identical scale events/metrics.
12. Auto Scale Recovery preset has a teachable delayed improvement, not instant elimination of all failures.

## C. UI integration and localization — P1.1/P1.3/P1.5

- English/Español selector actually changes **all** shell, controls, metrics, chart labels, glossary, tour and status/ARIA text (when each feature exists).
- Switching language or Simple/Technical explanation depth preserves simulation time, current in-flight, queue and all counters.
- Both language dictionaries have compile-time key parity; no missing untranslated fallback keys in release.
- Intro has clear fictional/simulated disclaimer; user can start without credentials.
- Start/pause/reset and scenario selector behave as described; controls have accessible labels.
- Guided tour next/back/skip/restart works and uses actual simulator state for experiments.
- “Why?” insight only appears on matching measurable conditions, not synthetic random suggestions.
- Autoscale flow shows pending/ready/min/max and translated explanations; event log mirrors engine outcomes.
- p95 renders `—` or localized No data when no completed request samples exist.
- Mobile no horizontal scrolling for core controls; chart has plain-text alternate summary.
- Keyboard-only navigation, visible focus, labels/icons independently convey status, reduced-motion disables decorative effects.

## D. Manual four-preset smoke checks

1. **Healthy:** nominal demand below capacity; throughput approx incoming after warm-up, no 503.
2. **Traffic Spike:** backlog fills; p95 increases for completed requests; 503 overflow occurs.
3. **Cache Rescue:** observed hits reduce origin demand; with specified constants **some** overload remains; do not label as a total fix.
4. **Auto Scale Recovery:** scheduled instance isn't immediately usable, count steps up after delay, service can approach healthy state under sustained moderate demand. Drop demand to observe safe eventual scale-in.
5. Toggle limiter: observe 429 vs 503 and explain distinction. Pause/resume and reset yield correct behavior.
6. Run all scenarios in English and Spanish, at both explanation levels, on narrow phone viewport and desktop.

## E. Quality gate for each milestone

```bash
npm run typecheck
npm run lint
npm test -- --run
npm run build
```

Do not claim production behavior is validated by synthetic tests. Record unverified browsers/devices honestly.
