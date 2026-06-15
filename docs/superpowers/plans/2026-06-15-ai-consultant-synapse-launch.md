# AI Consultant and Hybrid Synapse Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add the approved once-per-session Hybrid Synapse Launch and truthful system-time dock while making the Portfolio Concierge resilient, accessible, responsive, privacy-safe, and production-verifiable.

**Architecture:** `Home` coordinates two focused layout components through a small `useIntroSession` hook. The consultant is split into a presentation component, a state/transport hook, and a pure SSE parser; deterministic portfolio answers remain the trusted fallback. The Express Gemini route keeps the same endpoints while extracting pure validation helpers for bounded, testable input handling.

**Tech Stack:** React 19, TypeScript, Vite, Framer Motion, Lucide React, Express 5, Google GenAI, Vitest, Vercel

---

## File Map

- Create `artifacts/anupam-intelligence-systems/src/lib/intro-session.ts`: safe session-storage policy.
- Create `artifacts/anupam-intelligence-systems/src/hooks/use-intro-session.ts`: intro visibility, replay, skip, timing, and focus recovery.
- Create `artifacts/anupam-intelligence-systems/src/lib/system-time.ts`: pure local time, IANA timezone, and offset formatting.
- Create `artifacts/anupam-intelligence-systems/src/components/layout/hybrid-synapse-launch.tsx`: approved launch presentation.
- Create `artifacts/anupam-intelligence-systems/src/components/layout/system-time-dock.tsx`: persistent truthful time/status/replay dock.
- Create `artifacts/anupam-intelligence-systems/src/lib/consultant-stream.ts`: incremental SSE parser and stream contracts.
- Create `artifacts/anupam-intelligence-systems/src/hooks/use-portfolio-consultant.ts`: consultant state machine, conversation, cancellation, fallback, and recovery.
- Refactor `artifacts/anupam-intelligence-systems/src/components/assistant/consult-system.tsx`: accessible responsive dialog presentation.
- Modify `artifacts/anupam-intelligence-systems/src/pages/home.tsx`: coordinate intro, replay, system dock, and existing page.
- Create `artifacts/api-server/src/routes/gemini/validation.ts`: bounded chat payload normalization.
- Modify `artifacts/api-server/src/routes/gemini/index.ts`: use validation helper and preserve safe streaming behavior.
- Modify package scripts/config only as required to run Vitest and repository verification.

### Task 1: Establish Test Harness and Pure Policy Tests

**Files:**
- Modify: `package.json`
- Modify: `artifacts/anupam-intelligence-systems/package.json`
- Modify: `artifacts/api-server/package.json`
- Create: `artifacts/anupam-intelligence-systems/src/lib/intro-session.test.ts`
- Create: `artifacts/anupam-intelligence-systems/src/lib/system-time.test.ts`
- Create: `artifacts/anupam-intelligence-systems/src/lib/consultant-stream.test.ts`
- Create: `artifacts/anupam-intelligence-systems/src/data/assistant.test.ts`
- Create: `artifacts/api-server/src/routes/gemini/validation.test.ts`

- [x] **Step 1: Add Vitest scripts and dependency**

Add `test` scripts to the root and both packages, add Vitest as a workspace development dependency, then run `pnpm install`.

- [x] **Step 2: Write failing policy/parser/validation tests**

Cover:
- first-session, repeat-session, replay-independent storage failure
- local time, IANA timezone, and GMT offset
- split SSE frames, malformed frames, explicit errors, and done frames
- deterministic portfolio routing for hiring fit, NexusRAG, and unknown prompts
- Gemini input content type, bounded content, role filtering, and bounded history

- [x] **Step 3: Run tests to verify RED**

Run: `pnpm test`

Expected: FAIL because the new pure modules and validation exports do not exist.

### Task 2: Implement Session, Clock, Stream, and Validation Helpers

**Files:**
- Create: `artifacts/anupam-intelligence-systems/src/lib/intro-session.ts`
- Create: `artifacts/anupam-intelligence-systems/src/lib/system-time.ts`
- Create: `artifacts/anupam-intelligence-systems/src/lib/consultant-stream.ts`
- Create: `artifacts/api-server/src/routes/gemini/validation.ts`
- Modify: `artifacts/api-server/src/routes/gemini/index.ts`

- [x] **Step 1: Implement minimal pure helpers**

Implement safe storage reads/writes, deterministic time formatting, retained-buffer SSE parsing, and bounded Gemini payload normalization.

- [x] **Step 2: Run focused tests to verify GREEN**

Run: `pnpm test`

Expected: all helper and existing assistant routing tests pass.

- [x] **Step 3: Run typecheck**

Run: `pnpm typecheck`

Expected: exit code 0.

### Task 3: Implement Hybrid Synapse Launch and System Dock

**Files:**
- Create: `artifacts/anupam-intelligence-systems/src/hooks/use-intro-session.ts`
- Create: `artifacts/anupam-intelligence-systems/src/components/layout/hybrid-synapse-launch.tsx`
- Create: `artifacts/anupam-intelligence-systems/src/components/layout/system-time-dock.tsx`
- Modify: `artifacts/anupam-intelligence-systems/src/pages/home.tsx`

- [x] **Step 1: Implement intro session hook**

Use the tested storage policy, a maximum 1.6-second timer, reduced-motion near-instant completion, replay focus recovery, Escape/skip handling, and cleanup.

- [x] **Step 2: Build the approved launch presentation**

Render supported identity/proof copy and a meaningful schematic AI core over the already-rendered portfolio. Include reachable `Skip intro` and no fabricated telemetry.

- [x] **Step 3: Build the truthful system-time dock**

Tick once per second, show browser-local time/timezone/offset/status, expose a touch-friendly replay control, and avoid overlap with the consultant trigger.

- [x] **Step 4: Wire layout components into Home**

Coordinate intro visibility and replay without delaying the hero or changing existing sections.

- [x] **Step 5: Run tests, typecheck, and build**

Run: `pnpm test && pnpm typecheck && pnpm build`

Expected: exit code 0.

### Task 4: Refactor and Harden Portfolio Concierge

**Files:**
- Create: `artifacts/anupam-intelligence-systems/src/hooks/use-portfolio-consultant.ts`
- Modify: `artifacts/anupam-intelligence-systems/src/components/assistant/consult-system.tsx`

- [x] **Step 1: Implement explicit consultant state machine**

Support `checking`, `ready-gemini`, `ready-offline`, `streaming`, `offline-fallback`, and `error`; use the tested SSE parser, bounded recent history, AbortController timeout, cancellation, deterministic fallback, and cleanup.

- [x] **Step 2: Refactor dialog into presentation**

Keep compact prompts only before the first user message, add Clear/Cancel commands, preserve an independently scrolling history and always-visible composer, announce status changes, trap focus, restore trigger focus, and lock background scroll.

- [x] **Step 3: Add useful section references**

Expose only supported section anchors based on the current question/answer and keep them optional and compact.

- [x] **Step 4: Run tests, typecheck, and build**

Run: `pnpm test && pnpm typecheck && pnpm build`

Expected: exit code 0.

### Task 5: Responsive and Browser End-to-End Verification

**Files:**
- Modify only files implicated by observed regressions.

- [x] **Step 1: Start local frontend and API**

Run the repository development command and verify the app and API are reachable.

- [x] **Step 2: Verify launch and dock workflows**

Use the Browser plugin to verify first load, same-session refresh skip, replay, skip, Escape, truthful clock, and non-overlap at `320x568`, `390x844`, `768x1024`, `1440x1000`, and short mobile landscape.

- [x] **Step 3: Verify consultant workflows**

Verify open/focus trap/focus restore, prompt response, clear, cancel, offline mode, fallback mode, independent message scrolling, visible composer, and no relevant console warnings/errors.

- [x] **Step 4: Verify existing portfolio workflows**

Verify hero navigation, executive view scroll behavior, mastery modal, contact surface, and page-level horizontal overflow remain healthy.

- [x] **Step 5: Fix observed issues and repeat checks**

For every observed bug, add or strengthen a regression test where practical, apply the smallest fix, and repeat the failing interaction.

### Task 6: Static, Security, Review, and Production Gates

**Files:**
- Modify only files implicated by verification findings.

- [x] **Step 1: Run complete local gates**

Run:
- `pnpm install --frozen-lockfile`
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `pnpm audit:prod`
- `pnpm dlx knip`
- `git diff --check`

- [x] **Step 2: Run scoped privacy and secret checks**

Search tracked source for exposed API keys, client/internal names, prohibited private claims, unsafe HTML insertion, unbounded chat input, and accidental conversation persistence. Confirm `.env` remains ignored and absent from the frontend bundle.

- [x] **Step 3: Review final diff**

Inspect `git status`, `git diff --stat`, and the full intended diff. Attempt CodeRabbit review if its local CLI is available; otherwise record that limitation and complete a manual code-quality review.

- [x] **Step 4: Commit and push main**

Commit only the intended implementation and verification artifacts with a concise neutral message, then push `main` to `origin`.

- [x] **Step 5: Deploy and verify Vercel production**

Verify the connected project deployment reaches READY, health returns 200, Gemini status is correct, chat streams or falls back honestly, runtime logs are clean, and responsive production checks pass.
