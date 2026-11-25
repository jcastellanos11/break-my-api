# Break My API

**Decision date:** 2026-11-23  
**Status:** P1.5.1 modular navigation, bilingual learning center and contextual help implemented.
**Project:** A safe, **bilingual (English/Spanish)** educational API overload *simulation* for a professional engineering portfolio.

## Run locally

Use Node.js 24 LTS (validated with 24.21.0) and npm.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. The EN/ES selector switches the entire shell;
Open Playground to select a scenario and start its local simulation. There are no real API targets or traffic requests.

```bash
npm run typecheck
npm run lint
npm test -- --run
npm run build
```

`npm run preview` serves the static production build. No deployment has been configured.
See [the milestone handoff](docs/11-P1.1-P1.2-HANDOFF.md) for the foundation architecture, engine usage,
assumptions, changed paths, validation evidence and limitations. The installed toolchain is
locked in `package-lock.json`; React/React DOM are the only runtime dependencies.

## Owner-approved decisions

| ID | Area | Approved outcome |
|---|---|---|
| Q1 | Audience | Beginners **and** experienced developers equally |
| Q2 | Languages | English **and** Spanish at MVP launch |
| Q3 | Education | Three-step guided tour + contextual, inline explanations |
| Q4 | Traffic | Entirely synthetic and local in the browser, no real load |
| Q5 | Mechanisms | Queue, capacity, cache, rate limit **and autoscaling** in MVP |
| Q6 | Visual | Friendly educational design with **minimalist** composition |
| Q7 | Value | Equally strong learning experience and technical portfolio |

## Read in this order

1. `docs/01-PRODUCT-VISION.md` — goals, audience, positioning, boundaries.
2. `docs/02-REQUIREMENTS.md` — stories, functional and nonfunctional scope.
3. `docs/03-EDUCATIONAL-EXPERIENCE.md` — bilingual guided tour, contextual teaching and levels.
4. `docs/04-TERMINOLOGY-AND-CLOUD-MAPPING.md` — universal vocabulary, cloud analogies.
5. `docs/05-SIMULATION-ENGINE.md` — pipeline, deterministic metrics, model invariants.
6. `docs/06-ARCHITECTURE.md` — stack, localization, design, file structure.
7. `docs/07-IMPLEMENTATION-PLAN.md` — small milestones (P1.1–P1.6), with autoscaling scoped at P1.4.
8. `docs/08-DECISIONS-AND-INTERVIEW.md` — recorded and approved answers.
9. `docs/09-TESTING-AND-ACCEPTANCE.md` — proof of correctness and localization tests.
10. `docs/10-LOCALIZATION-AND-DESIGN.md` — visual identity, i18n contract and bilingual UX.
11. `AGENTS.md` — Codex instructions; authoritative scope and review protocol.
12. `CODEX_START_PROMPT.md` — first scoped Codex run (P1.1 and P1.2 only).

## MVP at a glance

- One fictional endpoint: `GET /api/products`, with transparent synthetic request/response examples.
- A deterministic, browser-only TypeScript engine; **no backend, database or authentication**.
- Incoming RPS, processing time, instances, concurrency slots, bounded FIFO queue, eligible-GET cache, token-bucket rate limiting.
- **Simple autoscaling:** bounded +1 scale-out when sustained overload occurs, provisioning delay, cooldown, and conservative scale-in when idle; model behavior must be labeled and tested.
- Guided Tour (3 steps), Playground, inline glossary and rule-driven “Why?” explanations.
- **English and Spanish shipped together**, using centralized typed localization dictionaries and a language switcher.
- **Simple / Technical** explanation depth on the same screen, not separate applications.
- Educational/minimalist aesthetic: friendly light foundation, intentional accent colors, responsive charts, not a dark sysadmin console by default.
- Vite + React + strict TypeScript, Vitest, Testing Library, Recharts (or lightweight equivalent), CSS/CSS Modules, static Cloudflare Pages deployment.
- No real traffic to test endpoints, no arbitrary URLs or target scanning.

## Product invariant

**Every control maps to a documented rule; all displayed metrics come from simulation events.** The model is a teaching tool, not a cloud capacity prediction or production benchmark.

## Continue Phase 1

The Playground advances by 250 simulated milliseconds per visible callback. Hidden
callbacks are skipped. Pause freezes the model, and Resume continues from that point.
Reset and scenario selection restore the selected preset and seed and leave it ready
to start. Live control edits preserve accepted work. Each plot point represents a
completed simulated second. Expand the chart data table to inspect all retained points.

Auto Scale Recovery starts at 40 RPS with one three-slot instance. Each full simulated
second after enabling scaling counts as a pressure window if it ends with queued
requests or contains a 503. Two consecutive windows schedule one launch. It becomes
usable two seconds later. Decisions are separated by at least five seconds. The
idle clock tracks actual events, including intervening utilization peaks, and requires
ten continuous seconds at or below 25% utilization with no waiting, overflow, or
pending launch. Disabling scaling drains extra busy capacity toward the manual count.
The disclosure retains the most recent 60 scaling events.

Open Guided Tour in the Playground for three optional lessons. The sample exchange is illustrative. Only the explicitly labeled preset reset changes experiment state. Simple and Technical share the same run.

The animated request flow visualizer is scheduled separately for P1.5.2.

## Learning center and navigation

The welcome screen at `/` and the dedicated `/playground` share one in-memory experiment. The Learn index at `/learn` links to `/learn/fundamentals`, `/learn/http-status` and `/learn/glossary`. The About page is at `/about`. Share a code with a URL such as `/learn/http-status?code=429`.

Navigation uses the browser History API. The Playground stays mounted while other modules are visible, so the controller retains its model, clock, queue and pending launches. A reload starts a fresh session. Cloudflare Pages route rewrites are in `public/_redirects`; other static servers must serve `index.html` for the application routes.

The bilingual catalog was checked on 2026-11-24 against the [IANA registry](https://www.iana.org/assignments/http-status-codes) and [MDN HTTP reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status). It covers 58 entries. It omits unassigned values, historical 102, temporary 104, reserved 402, deprecated 305 and 510, and unused 306. The required 418 entry explains its unused registration. Only 200, 429 and 503 are engine outcomes. Catalog examples run no requests.
