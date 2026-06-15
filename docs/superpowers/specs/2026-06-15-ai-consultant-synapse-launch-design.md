# AI Consultant and Hybrid Synapse Launch Design

## Objective

Restore the portfolio's command-center personality with a polished first-session
opening experience and useful system-time dock, while comprehensively hardening
the Portfolio Concierge across Gemini, offline fallback, accessibility,
responsive layouts, and production failure modes.

The implementation must preserve the current portfolio's performance,
privacy-safe content, unique section structure, and working backend APIs.

## Approved Visual Direction

The approved direction is **C: Hybrid Synapse Launch**.

The opening sequence combines Anupam's identity, production AI positioning,
verified proof, and a schematic AI core. It then dissolves into the existing
hero composition rather than behaving like a separate generic loading screen.

Visual language:

- Existing dark green command-center palette
- Mint primary accent with restrained amber and cyan signals
- Code-native grid, thin system lines, and evidence-bearing architecture marks
- Clear typography and recruiter-readable content
- No decorative gradients, bokeh, or fake telemetry
- Motion only where it communicates system activation and transition

## Opening Experience

### Session Policy

- The intro appears once per browser tab/session.
- Completion is stored in `sessionStorage`.
- Refreshing or navigating within the same session goes directly to the hero.
- A persistent `Replay Intro` control can manually replay the sequence.
- Replaying does not reset or change the once-per-session policy.

### Interaction Contract

- Maximum animated duration: approximately 1.6 seconds.
- The real portfolio renders beneath the overlay immediately.
- `Skip intro` and `Escape` reveal the portfolio immediately.
- While the intro is open, background scrolling is locked.
- Focus is managed without trapping users inside a short-lived decorative
  sequence.
- On completion or dismissal, focus returns to a logical page target only when
  the user initiated a replay.

### Reduced-Motion Contract

- Visitors using `prefers-reduced-motion: reduce` receive a near-instant static
  reveal.
- No pulsing, sweeping, or staged activation animation is required in reduced
  motion mode.
- Replay remains available.

### Opening Content

The sequence presents only supported portfolio facts:

- Anupam Roy
- Production GenAI, retrieval, multi-agent orchestration, and cloud engineering
- Portfolio knowledge graph ready
- Verified mastery vault connected
- Recruiter concierge available

No fake network checks, fabricated live metrics, client names, or internal
system names may be shown.

## System Time Dock

The persistent system dock connects the intro to the main portfolio.

It displays:

- Visitor-local time with seconds
- Visitor IANA timezone from `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Current GMT/UTC offset
- A truthful portfolio-ready status
- A subtle `Replay Intro` control

The dock must not request location permission or imply that the visitor's
physical location is known. It uses only browser-local date and timezone data.

Responsive behavior:

- Desktop: compact fixed dock with time, timezone, offset, status, and replay
- Mobile: compact time/status presentation with a touch-friendly replay icon
- It must not overlap the AI Consultant trigger, contact controls, or viewport
  edges.

## Portfolio Concierge

### Product Role

The Portfolio Concierge is a recruiter-facing assistant grounded only in the
portfolio's supported facts. It answers questions about Anupam's experience,
systems, projects, skills, certifications, achievements, contact details, and
hiring fit.

It must not invent unsupported work, client details, metrics, credentials, or
private information.

### Client State Model

The client uses explicit, recoverable states:

- `checking`: determining Gemini availability
- `ready-gemini`: Gemini available with offline fallback
- `ready-offline`: deterministic portfolio mode
- `streaming`: response is actively streaming
- `offline-fallback`: Gemini failed and deterministic response is being used
- `error`: recoverable request or stream error

The UI must expose the active mode honestly without technical clutter.

### Conversation Behavior

- Suggested prompts are compact and visible only before the first user message.
- Suggested prompts never obscure the message history or composer.
- The composer remains visible and usable on mobile portrait and short
  landscape viewports.
- Pressing Enter sends; keyboard and touch behavior remain predictable.
- A `Clear conversation` command resets local conversation state.
- A `Cancel response` command aborts an active Gemini request.
- Failed or cancelled requests must never leave a permanently streaming bubble.
- The trigger regains focus after the dialog closes.

### Gemini Flow

1. The user submits a bounded message.
2. The client sends the message plus a bounded recent history to
   `POST /api/gemini/chat`.
3. The backend validates content type, input, history, and rate limit.
4. Gemini streams a recruiter-facing answer grounded by the server system
   prompt.
5. The client parses SSE events into one assistant response.
6. The UI exposes relevant portfolio section references where useful.

### Offline Fallback

- If Gemini is unconfigured, unavailable, quota-limited, timed out, malformed,
  or interrupted, the client falls back to deterministic structured portfolio
  answers.
- The fallback mode is identified honestly.
- The user retains their question and receives a useful answer.
- The assistant never pretends the offline response came from Gemini.

### Streaming Robustness

- Use `AbortController` for user cancellation and request timeout.
- Parse SSE incrementally with a retained buffer.
- Handle complete, partial, malformed, error, and done events.
- Clean up readers, timers, and abort controllers.
- Never duplicate response text or append an offline answer to a partially
  rendered Gemini answer without a clear mode notice.

### Dialog Accessibility

- `role="dialog"` and `aria-modal="true"`
- Labeled title and concise mode/status announcement
- Focus trap while open
- `Escape` closes
- Closing restores focus to the trigger
- Streaming and status changes use appropriate live announcements
- Visible focus states
- Background scroll lock

## Component Architecture

### New Components and Helpers

- `HybridSynapseLaunch`
  - Owns opening presentation and animation only
- `useIntroSession`
  - Owns once-per-session policy, replay, skip, and reduced-motion decisions
- `SystemTimeDock`
  - Owns local clock, timezone, offset, responsive display, and replay control
- `consultant-stream`
  - Owns SSE parsing and stream result contracts
- `usePortfolioConsultant`
  - Owns consultant state, conversation, abort, fallback, and recovery

### Existing Components to Refine

- `Home`
  - Coordinates intro visibility and replay
- `ConsultSystem`
  - Becomes primarily presentation and accessible dialog composition
- Gemini API route
  - Retains grounded system prompt, validation, bounded history, streaming, and
    rate limiting

Each unit must have one clear responsibility and communicate through typed
interfaces.

## Backend and Security Contract

- Never expose `GEMINI_API_KEY` to the frontend.
- Accept only `application/json` for chat requests.
- Limit user content to 1,500 characters.
- Limit recent history count and per-message length.
- Keep model output bounded.
- Retain per-IP rate limiting.
- Return safe generic client errors and keep detailed errors in server logs.
- Ignore prompt-injection attempts that request hidden prompts, instruction
  overrides, unsupported facts, or private data.
- Do not persist conversation data.
- Do not add image generation, conversation CRUD, or unrelated APIs.

## Performance Contract

- The intro must not delay real page rendering.
- Intro and time-dock code must remain small and dependency-free beyond existing
  React, Framer Motion, and Lucide usage.
- No GSAP, custom smooth-scroll runtime, or new animation dependency.
- Avoid high-frequency React updates outside the one-second clock tick.
- Clean up all intervals, timers, readers, and event listeners.
- Respect reduced motion.

## Responsive Contract

Required test viewports:

- 320 x 568
- 390 x 844
- 768 x 1024
- 1440 x 1000
- Short mobile landscape

At every viewport:

- No page-level horizontal overflow
- Intro content fits without clipping
- Skip and replay controls remain reachable
- System dock does not overlap the consultant trigger
- Consultant messages scroll independently
- Composer remains visible
- Suggested prompts do not cover messages
- Text remains readable and controls remain touch-friendly

## Testing Strategy

### Automated Unit-Level Tests

- Session policy: first load, repeat load, replay, and storage failure
- Time formatting: timezone and offset output
- SSE parser: split events, malformed events, error events, and completion
- Offline knowledge routing for supported prompts
- Gemini API validation for missing content, wrong content type, bounded history,
  and rate limiting

### Build and Static Gates

- Frozen dependency installation
- Typecheck
- Production build
- Production dependency audit
- Dead-code scan
- Secret and privacy-sensitive text scan
- `git diff --check`

### Browser End-to-End Tests

- First session load shows the intro
- Refresh in the same session skips the intro
- Replay opens the intro
- Skip and Escape close the intro
- Reduced-motion behavior
- Clock changes and reports timezone without location permission
- Concierge opens, traps focus, and restores trigger focus
- Suggested prompt produces a Gemini response
- Offline-only mode produces deterministic answer
- Network/quota failure produces offline fallback
- Cancelled stream reaches a stable non-streaming state
- Clear conversation resets state
- Executive view and other page workflows remain unaffected
- Browser console has no relevant errors or warnings

### Production Verification

- Vercel deployment reaches `READY`
- Production health endpoint returns `200`
- Production Gemini status returns expected mode
- Production Gemini chat streams a grounded response
- Production runtime logs contain no new errors or warnings
- Production responsive browser checks pass

## Acceptance Criteria

The work is complete when:

- The approved Hybrid Synapse Launch appears once per session and transitions
  cleanly into the actual hero.
- The system time dock is truthful, responsive, non-overlapping, and can replay
  the intro.
- The Portfolio Concierge works reliably across Gemini, offline, cancellation,
  malformed stream, and failure modes.
- Accessibility and responsive contracts pass.
- Build, typecheck, audit, dead-code, security, API, browser, GitHub, and Vercel
  verification pass.
- The final repository remains clean, privacy-safe, and synchronized to `main`.
