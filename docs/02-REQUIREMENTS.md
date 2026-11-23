# 02 — Requirements and MVP scope (approved)

## Functional requirements

| ID | Priority | Requirement | Acceptance |
|---|---|---|---|
| FR-01 | Must | Welcome / explicit simulation notice | Usable without account; no misleading real-world telemetry. |
| FR-02 | Must | 3-step guided tour | Next/back/skip; each lesson highlights or changes one relevant model aspect. |
| FR-03 | Must | Playground start/pause/reset | Pause freezes simulated time; reset produces same results given same seed. |
| FR-04 | Must | Adjust incoming request rate | 10–500 synthetic RPS; clear units and source. |
| FR-05 | Must | Adjust base processing capacity | Compute instances (1–8), concurrency per instance (1–20), service time (50–1000 ms) are separate. |
| FR-06 | Must | Finite FIFO waiting queue | Processing, waiting and 503 overflow accounted for precisely. |
| FR-07 | Must | Simple eligible-GET response cache | Configured hit probability (0–80% UI), measured hits; hits bypass origin slots. |
| FR-08 | Must | Token-bucket rate limiting | Toggle and cap; excess is 429, never silently dropped. |
| FR-09 | Must | Graphs and observable request flow | Incoming, successes, 429/503, queue depth; chart points from the engine. |
| FR-10 | Must | Measured metrics | Incoming RPS, successful throughput, in-flight, waiting, completed, 429, 503, observed p95, cache hits, effective instances. |
| FR-11 | Must | Contextual learning | Inline definitions, cause/mitigation explanations and glossary. |
| FR-12 | Must | Vendor-neutral terms | Conceptual Compute Instance; provider-specific naming only in clearly qualified mappings. |
| FR-13 | Must | Example request/response | `GET /api/products` and JSON `200` explicitly fictional; no network request. |
| FR-14 | Must | Teaching presets | Healthy, Traffic Spike, Cache Rescue, Auto Scale Recovery. |
| FR-15 | Must | Responsive/accessibility | Keyboard, contrast, text chart descriptions, reduced motion, mobile. |
| FR-16 | Must | **English + Spanish** | Real UI language switching; all nav/controls/onboarding/help/alerts/chart labels/ARIA states translated; same engine state preserved. |
| FR-17 | Must | **Simplified automatic scaling** | Toggle; sustained overload -> delayed +1 active instance up to max; delayed idle -> safe -1 down to min; cooldown and event log. |
| FR-18 | Must | **Simple / Technical** explanation depth | Switch copy/detail without changing the running simulation or its metrics. |
| FR-19 | Should | Simple comparison insights | Identify actual observed trade-offs without unprovable causal claims. |
| FR-20 | Could | Shareable preset / URL | Not required for MVP; no data storage necessary. |
| FR-21 | Later | More endpoints and cache eligibility | POST/authorization/TTL/invalidation only after MVP. |

## Canonical controls: deliberately limited

- `Incoming traffic`: integer 10–500 RPS.
- `Compute instances`: 1–8 manually when autoscaling off; when on, current instances are read-only and base/min count uses the selected manual number.
- `Concurrency per instance`: 1–20 slots.
- `Processing time`: 50–1000 ms; constant for each admitted origin request at its start.
- `Waiting queue limit`: 0–1000.
- `Response cache`: on/off and configured hit fraction 0–80% for eligible GETs.
- `Rate limit`: on/off and admission cap 10–500 req/s.
- `Auto scaling`: one on/off control and a visible `min -> current -> max` display. Max 8; delay/cooldown/sustained thresholds fixed constants (documented in Engine and UI help), **no advanced policy editor**.
- `Language`: English/Español; `Explanation depth`: Simple/Técnico. Both presentation controls leave engine time and counters unchanged.

All numeric limits are arbitrary UX teaching bounds, **not provider defaults**.

## Important metric semantics

- **Incoming RPS**: arriving synthetic events / simulated seconds in window.
- **Successful throughput**: responses completed with HTTP 200 / simulated seconds in window (includes origin and completed cache hits).
- **429 vs 503**: limiter rejection vs queue overflow; they must not be merged into a single "failures fixed" claim.
- **In-flight**: active requests occupying processing slots; **queue depth**: waiting accepted requests.
- **Observed p95**: nearest-rank 95th percentile of completed successful request end-to-end durations in current window; `—` if no samples.
- **Cache hit rate**: completed/served cache-hit count divided by admitted eligible GETs according to documented window; do not confuse configured probability with observed result.
- **Effective instance count**: currently usable simulated compute capacity; scheduled instance additions must **not** increase this count until the provisioning delay passes.
- **Utilization** (if shown): origin slots active / effective configured slots. Never label it CPU usage.

## Main user stories

- **Beginner:** “I can see what a request is and why waiting happens with plain language.”
- **Engineer:** “I can observe 429 vs 503, change policies and reproduce the experiment using same config and seed.”
- **Learner:** “I can turn on cache or auto scaling and discover why neither works immediately or in every scenario.”
- **Spanish-speaking learner:** “I can navigate lessons, interactions and hints completely in Spanish.”
- **Bilingual engineer:** “Changing language leaves my simulation unchanged.”
- **Mobile visitor:** “I can operate and understand the app without hover interactions or horizontal scrolling.”

## Non-functional requirements

- Single static React app, browser-only synthetic engine; no authentication, database, real-load API or arbitrary user URL input.
- Pure deterministic engine, bounded event structures/history (60–120 points), fixed simulation clocks independent of chart render.
- Avoid overengineering: one simulated service, one endpoint, one policy for auto scale, small localization system.
- Engine unit tests + critical integration tests; typecheck/lint/tests/build pass.
- Semantic HTML, focus states, 44px touch targets where possible, non-color-only statuses, `prefers-reduced-motion`.
- No unqualified cloud-provider equivalence or fabricated cost, CPU, memory, throughput or latency figures.
- Deployable as static build to Cloudflare Pages; document real Cloudflare configuration before deployment.

## MVP done

All Must requirements FR-01..FR-18 demonstrably work in both languages where applicable. Simulation invariants and scaling rules pass tests; UI works on mobile; user can safely run and explain one failure and one improvement. Extras are deferred.
