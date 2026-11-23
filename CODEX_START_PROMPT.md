# Codex — Phase 1 starting prompt (approved scope)

Act as a senior full-stack software engineer with excellent product judgment, technical pedagogy and frontend UI/UX skills. Build **Break My API**, a beautiful, educational, browser-only **synthetic API load simulator** for a senior engineer's portfolio.

**MANDATORY:** Read `README.md`, `AGENTS.md`, and **all files** in `docs/` before editing. The seven decisions in `docs/08-DECISIONS-AND-INTERVIEW.md` are approved. The milestones in `docs/07-IMPLEMENTATION-PLAN.md` are the implementation boundary. If the repository already contains code, inspect and preserve it.

## Accepted product direction

- Audience: **both beginners and experienced engineers**. Same simulator, Simple and Technical explanation modes (do not build two apps).
- Localization: **English and Spanish from day one**. A real language switch and fully translated visible UI/copy and accessibility labels, with typed localization resources. No decorative/stub bilingual toggle.
- Learning: a 3-step guided tour, inline glossary/help and rule-driven contextual explanations (delivered in later milestones).
- UX: friendly educational design mixed with clean, minimalist visual hierarchy; intuitive and responsive. Avoid an overloaded or dark-hacker dashboard.
- Simulated only: never make high-volume real HTTP requests, never accept a URL target and never add infrastructure just for testing.
- Model: vendor-neutral compute instances/concurrency, accurate queue/cache/token-bucket limiting, deterministic event-derived metrics.
- **Autoscaling IS an MVP requirement**, but it is intentionally **P1.4**, *not part of this first implementation pass*. Prepare the model architecture to extend cleanly later, but do not implement premature scaling behavior.

## Implement ONLY P1.1 and P1.2 now

**P1.1 — App foundation and bilingual UI shell**
1. Inspect existing files and outline the architecture/data flow in a short response.
2. Scaffold Vite + React + strict TypeScript if necessary.
3. Make a polished, responsive light/friendly minimalist shell and clearly mark simulated data. Use real English/Spanish UI resources, a working language switch, bilingual placeholder labels (clearly labeled), accessible keyboard controls, focus styles and reduced-motion rules.
4. Install/configure only necessary dependencies; scripts for `dev`, `typecheck`, `lint`, `test`, `build`.

**P1.2 — Pure deterministic simulator engine**
1. Implement typed configuration, validation, presets and pure functions for reproducible synthetic request generation.
2. Model the request pipeline: incoming events -> token-bucket rate limiter -> eligible GET response cache -> processing slots -> bounded FIFO queue -> event-derived 200/429/503 outcomes.
3. Handle request completions, queue wait, scheduled cache completions, conservation accounting, predictable reset and bounded metric histories.
4. Track empirical successful-completion p95, do not invent latency values.
5. Keep simulator time independent of rendering; write deterministic engine unit tests matching `docs/09-TESTING-AND-ACCEPTANCE.md`.
6. Design engine types so **P1.4 autoscaling** can adjust active instance capacity later without changing previous request outcomes. **Do not implement scaling policy now.**

## Before finishing

- Run `npm run typecheck`, `npm run lint`, `npm test -- --run` and `npm run build`; report exact results.
- Provide a concise summary of architecture, files changed, test evidence, known limitations and a proposed P1.3 prompt.
- Stop after P1.1 + P1.2. Do NOT implement full Playground interaction, autoscaling, the guided tour or deploy in this pass.
- No commits, pushes, remote resource changes or deployment without explicit permission.

Quality criterion: the app may be incomplete at this milestone, but what exists must be truthful, bilingual, attractive, accessible and tested.
