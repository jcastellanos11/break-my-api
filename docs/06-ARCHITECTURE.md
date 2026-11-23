# 06 — Technical architecture, localization, UX

## 1. Deployment and safety

```text
Browser (static application hosted on Cloudflare Pages)
  ├── React/TypeScript presentation (EN/ES; Simple/Technical)
  ├── Tour, glossary, controls, scenario presets, responsive metrics
  ├── Simulation controller (local simulated clock + pause/reset)
  │     └── Deterministic TypeScript engine (requests, cache, queue, limiting)
  │           └── Simplified autoscale policy (P1.4)
  └── Local, engine-derived snapshots -> charts / insights / educational flow
```

No backend, DB, account, third-party traffic target, `fetch` load generator, AWS/Azure credentials, or analytics required. The illustrated API route `GET /api/products` is a **sample** only.

## 2. Implementation stack

- Vite + React + strict TypeScript.
- CSS Modules or lightweight CSS with theme tokens; favor reliability and minimal dependencies.
- Recharts or other small mature chart solution with accessible text equivalent.
- React hooks for UI/controller; separate simulation state from presentation state; no Redux needed.
- Typed custom localization dictionaries (`en`, `es`) with a small `useI18n()` context; an i18n library is optional only if demonstrated to simplify rather than complicate.
- Vitest + React Testing Library + user-event; ESLint; TypeScript compiler checks.
- Cloudflare Pages or equivalent static hosting.

## 3. Suggested directory layout

```text
break-my-api/
├── README.md
├── AGENTS.md
├── docs/
├── src/
│   ├── app/                     # shell, accessible nav, language + explanation mode
│   ├── components/
│   │   ├── controls/            # inputs, presets, simulate/pause/reset
│   │   ├── simulation/          # metrics, flow, charts, scale event feed
│   │   └── learning/            # 3-step tour, glossary, insight cards
│   ├── engine/
│   │   ├── types.ts             # configuration, events, snapshots
│   │   ├── simulation.ts        # event scheduling and deterministic state
│   │   ├── rateLimiter.ts
│   │   ├── metrics.ts
│   │   ├── presets.ts
│   │   ├── autoscaling.ts       # P1.4 ONLY; model-independent policy
│   │   └── *.test.ts
│   ├── i18n/
│   │   ├── en.ts                # full English dictionary
│   │   ├── es.ts                # full Spanish dictionary
│   │   ├── types.ts             # shared typed keys; compile-time parity
│   │   └── I18nProvider.tsx
│   ├── content/                 # lesson content or structured glossary data
│   ├── hooks/
│   └── styles/                 # visual tokens and responsive rules
└── package.json
```

## 4. Information architecture

**Welcome:** title, short bilingual value proposition, Start Experiment and Guided Tour, simulation disclaimer, language selector.

**Playground:** top navigation/language/level controls, intuitive scenario presets, concise controls rail, central flow map (`Client -> Rate limiter -> Cache -> FIFO waiting -> Processing -> Response`), metrics, 2–3 graphs, contextual “Why?” panel. Status labels always accompany colors.

**Learning:** 3-step overlay or guided panel pointing at real live controls, short glossary accessible inline, Simple / Technical view that alters only wording/detail.

**Autoscaling:** one clear toggle. Active count, pending unit count and max displayed; “Provisioning…” state in the flow; chronological event labels; fixed policy explained in help. Do **not** build separate scale dashboards or tunable cloud-policy editors.

On mobile prioritize start/pause and key metric; collapse advanced controls; charts never require sideways scrolling for basic operation; tooltips accessible by touch.

## 5. Visual approach — approved blend

Education-first + minimalist: warm off-white/light surfaces, generous whitespace, playful but restrained accents and simple illustrated flow nodes. Use high-contrast charcoal text, rounded controls, intentional transitions and typographic hierarchy. Should feel like a modern learning product, **not a dense admin screen**, not a cluttered game, and not a generic black neon hacker terminal.

Give stages and status consistent visual language: success, rejection, waiting, caching, scale pending; never rely on color alone. Respect `prefers-reduced-motion`; avoid hundreds of per-request DOM nodes at 500 RPS. Illustrate aggregated model events instead.

## 6. Technical boundaries

- One deterministic event engine is source of truth, not React's re-render count.
- Simulation time advances in controlled steps; browser tab throttling doesn't imply skipped real requests.
- Snapshot history bounded; no potentially unbounded request payload arrays or expensive chart redraws.
- Language and explanation-depth changes **must not reset** the model.
- Store UI preferences in localStorage **only if** it does not leak any data or interfere with deterministic simulation. No cookies/tracking required.
- Don't pretend there is a back-end API because the screen depicts one.

## 7. Engineering review points

P1.1: bilingual shell/design tokens; P1.2: tested pure engine; P1.3: truthful charts and interactive inputs; P1.4: bounded auto scaling & event teaching; P1.5: bilingual lessons + level modes; P1.6: QA, responsive, accessibility, static publish.
