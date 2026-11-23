# 01 — Product vision (approved)

## Product

**Break My API** — *Learn what happens when traffic gets out of control.*

An interactive web product that safely simulates API overload, teaches practical infrastructure fundamentals and showcases engineering design quality. The metaphor “break” is playful; **no real service is flooded or stressed**.

## The problem

Students and beginners see dashboards that speak in RPS, p95, concurrency and 429 without understanding them. Experienced engineers often need a fast and reliable model for demonstrating bottlenecks, backpressure, caching and scaling trade-offs.

## Two audiences, one product

- **Beginners** should be able to understand request/response, observe overload and make one useful mitigation without prior cloud knowledge.
- **Experienced developers** should find precise metrics, assumptions and repeatable experiments, including autoscaling behavior and cloud vocabulary caveats.
- The product uses **Simple / Technical** explanatory depth. These are educational display modes; underlying simulation configuration and rules stay identical.

## Core promise

The visitor can: (1) inspect a simulated `GET /api/products`, (2) increase synthetic incoming traffic, (3) observe processing saturation/queue growth/429 and 503, (4) enable cache, rate limiting, manual scaling or simplified **automatic scaling**, (5) understand *what improved and what trade-off remained*.

## Product experiences

1. **Guided Tour:** three short interactive steps; user may skip or revisit.
2. **Playground:** sliders/toggles, four teachable scenarios, request flow, measured charts.
3. **Learn in context:** inline bilingual definitions, “Why did this happen?” explanations, glossary and Simple/Technical explanation depth. No course management system.

## Identity and access

- **English and Spanish from launch**; visitor can switch language without resetting the simulation.
- Friendly, educational and a little playful, but **visually minimal**: generous whitespace, carefully chosen colors, crisp type, good contrast, intentional motion.
- Usable on phone and desktop, including keyboard-only and reduced-motion.
- No registration, no onboarding form and no personal data needed.

## Portfolio-quality differentiators

- Independent, deterministic simulation engine in TypeScript with testable invariants.
- Correct distinction between request rate and concurrency; queueing, caching, throttling and autoscaling based on documented rules.
- Transparent limitations and carefully qualified AWS/Azure examples.
- Bilingual product thinking, accessible charts and coherent UI architecture.
- Small enough to build as an incremental MVP, without a backend.

## Success criteria

- A newcomer can run the first experiment quickly, understand an HTTP request and identify the cause of queueing.
- An engineer can use metrics to make and explain a trade-off; results repeat for the same config/seed/time.
- Each displayed KPI corresponds to model events, not randomized illustration.
- The guided flow, terminology and key controls exist **in both languages**.
- The autoscaling mode visibly responds only after sustained demand and a provisioning delay, with hard maximum capacity.

## Hard boundaries

Not included: load testing / real request flooding / arbitrary target URLs; production AWS/Azure simulations, cost estimators or real CPU metrics; backends, databases, auth, telemetry, AI tutors or collaboration; cache invalidation/TTL, retries and network failure modeling.

**Always display** “Simulated traffic / Tráfico simulado” and “Not a real benchmark / No es una prueba de rendimiento real” near metrics.
