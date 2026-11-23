# 03 — Educational experience (approved)

## One simulator, two levels of explanation

Visitors are both beginners and experienced developers. Show the *same* engine and charts to everyone, with an explanation depth switch:

- **Simple / Sencillo:** short everyday analogy, clear actionable meaning, minimal jargon.
- **Technical / Técnico:** accurate parameter names, units, event ordering, measured metrics, assumptions and trade-offs.

The switch does **not** change model configuration, seed, counters or simulation time. All copy at both depths exists **in English and Spanish**.

## Progressive explanation structure

1. **Plain meaning** (one or two sentences).
2. **Inspect the technical concept** if requested: exact definition, caveats, links to related controls.
3. **Experiment:** change one parameter and see a model-derived consequence.

Avoid modal overload, long courses, quizzes and user accounts. Tooltips cannot rely on hover: button + popover/drawer pattern works with touch and keyboard.

## Guided Tour — 3 steps, ~3–5 minutes

### 1. “An API is a conversation” / “Una API es una conversación”

- Show synthetic request `GET /api/products` and illustrative `200 OK` JSON response.
- Briefly teach client, method, path, response, status and latency.
- An interactive "Send sample request / Enviar solicitud de ejemplo" illustrates the request-flow **locally** without sending HTTP to other services.
- Exit criterion: visitor can identify request vs response.

### 2. “When traffic piles up” / “Cuando se acumulan las solicitudes”

- Apply Traffic Spike preset, highlight RPS vs concurrency vs processing time.
- Watch active processing slots fill, queue grow and some arrivals receive 503.
- Show growing observed latency (when completed samples exist); explain that queue length alone does not increase processing capacity.
- Optional technical insight: Little's Law intuition under steady-state assumptions, not a universal formula.
- Exit criterion: user identifies the bottleneck.

### 3. “Protect or scale” / “Proteger o escalar”

- Try cache, rate limit, manual capacity and **Auto scaling** (one guided control; no advanced tuner).
- Explain that cache only serves some eligible GETs; 429 prevents overload by rejecting demand; auto scale takes time and stops at a configured maximum.
- Display scaling events only from the engine: `scale out scheduled`, `instance ready`, `scale in`.
- Exit criterion: user can identify one benefit and one trade-off for each technique.

## Rule-driven “Why?” insights (localized)

| Engine-derived condition | Simple message idea | Technical explanation idea |
|---|---|---|
| Sustained queue | “More requests arrive than can be handled right now.” | `incoming origin demand > completion capacity` over recent window; queue buffers accepted work. |
| Queue full + 503 | “The waiting line is full, so new requests are declined.” | Finite FIFO waiting capacity reached, overflow returns simulated 503. |
| Rate-limit 429 | “The traffic gate stops some requests on purpose.” | Token-bucket policy rejects before cache/origin, 429. |
| Cache HIT | “A saved answer avoided extra work.” | Eligible GET response served from simulated cache, bypassing origin processing slots. |
| Autoscale pending | “Extra capacity is on the way, but not ready yet.” | Sustained overload triggered one bounded scale-out; provisioning delay still running. |
| Auto scale limit reached | “The simulator has reached its maximum instances.” | No further scale-out above `maxInstances`; queue/503 may persist. |
| Scale-in | “Demand is low, so an unused instance was removed.” | No pending additions, sustained low utilization, cooldown elapsed, safe in-flight check. |
| Healthy steady state | “The service is keeping up in this experiment.” | No waiting or rejection over recent observation window, under this simplified model. |

**Never imply** all rejections disappear after scaling or that swapping 503 for 429 necessarily benefits end users. Prefer carefully stated observations over broad causal promises.

## Glossary minimum (translated at both levels)

API, HTTP request, HTTP response, status codes, RPS, throughput, concurrency, latency, p95, queue, cache, HIT/MISS, rate limiting, 429, 503, compute instance, horizontal scaling, **auto scaling**, startup/provisioning delay, cooldown. Cloud mapping is an optional technical reference, never a required prerequisite.

## Suggested bilingual microcopy samples

- EN: “Requests per second (RPS) is demand, not the number of users.”
- ES: “Las solicitudes por segundo (RPS) representan la demanda, no la cantidad de usuarios.”
- EN: “Automatic scaling adds processing capacity only after the new instance is ready.”
- ES: “El escalamiento automático añade capacidad solo cuando la nueva instancia está lista.”
- EN: “Traffic is simulated. No real API is being stressed.”
- ES: “El tráfico es simulado. No estamos sobrecargando ninguna API real.”

## UX and access

- Start immediately; offer Guided Tour without mandatory sequence, skip/back/restart controls.
- Technical text can expand inline without opening an entirely new product.
- Switching language and explanation depth must preserve running simulation.
- All tutorial labels, alerts, screen-reader descriptions, help popovers and graph accessibility summaries translated.
- Cap diagram animations and honor pause/reduced-motion; outcomes must match engine data, not fireworks.
- Display constant **Simulated traffic / Tráfico simulado** notice near results.

## Future lessons (not MVP)

Real distributed systems, retry storms, cache invalidation/TTL, circuit breakers, load balancing, database bottlenecks, IAM, provider billing, production metrics collection.
