# Implementation Plan — Online Student Examination Portal

## Product scope and constraints

Build the supplied Online Student Examination Portal as a static single-page application for GitHub Pages. Use React + Vite, Tailwind CSS, Lucide React, Recharts, `react-router-dom` with `HashRouter`, and the Appwrite Web SDK. Configure `vite.config.js` with the exact `base: './'` setting for GitHub Pages compatibility. Keep credentials out of source: support local `.env` configuration through `.env.example`, and describe the equivalent GitHub Actions secrets/variables needed for a production static build. Do not use Appwrite Storage, camera, microphone, or media recording. No Manus-managed backend/database is needed; the browser communicates with Appwrite Cloud.

The portal will implement student login/session guards, student home/dashboard/exam catalogue/history, a fullscreen timed one-question-at-a-time exam flow, answer review and one-attempt locking, plus admin login/dashboard, exam creation, publication controls, deletion and attempts review. Preserve the compact `exams` and `attempts` document fields, ID normalization, document permissions, 100-document query limits, termination flags, and the submission/listener/ref safeguards in the supplied brief. Include an Appwrite setup and GitHub Pages deployment guide.

**Security boundary to make explicit:** because the requested static-only design gives authenticated browsers read access to `exams.q`, and that JSON includes the correct option index `c`, students can inspect answer keys in browser network/devtools. Client-side scoring and tab/fullscreen monitoring are also bypassable by a determined user. The implementation can meet the requested UI-level behavior and Appwrite permissions, but must not claim server-grade exam integrity. README will explain that a server-side Appwrite Function/private answer-key design is required for a high-stakes exam. No hidden credentials or privileged API key will be shipped to the browser.

## Implementation and serving approach

1. Configure a pinned pnpm/Vite/React toolchain and reviewed dependency lifecycle policy. Add the requested `.env.example`; exclude `.env` and build output from Git.
2. Implement `HashRouter` routes and responsive application shell. Gate student routes using the Appwrite current session and admin routes using the authenticated user's `admin` label. Login maps normalized student IDs to the specified `@exam.local` address, clears a stale current session before creating a new one, and does not alter admin email addresses.
3. Encapsulate Appwrite client/account/database access and compact serialization in a small services layer. Use the exact collection attributes and permission rules from the brief, `Query.limit(100)` on list calls, and lowercase student IDs derived from `user.email.split('@')[0]` for attempt queries/display while using the Appwrite user ID for document permissions.
4. Implement exam creation/management as accessible forms. The exact number entered in Total Number of Questions dynamically renders that exact number of question cards; each card contains a Question Text input, four option inputs (A–D), and a Correct Option radio/dropdown selector. Enforce complete questions/options/correct-answer fields and positive duration, and persist the required compact question JSON. Student exam availability checks both publication and existing `(uid,eid)` attempts, including terminated attempts.
5. Implement the live exam lifecycle around refs and one guarded submission path: synchronize answer state to `answersRef`, use `isSubmittingRef`, attach anti-cheat listeners only after fullscreen succeeds, remove/disable them before normal fullscreen exit, and clean up listeners/timer. Handle `visibilitychange`, `blur`, `fullscreenchange`, and `beforeunload`; auto-submit on timer expiry; disable selection/context menu/copy/paste only during the active exam. Use a custom React submit modal, never native `alert`/`confirm`. Provide Previous and Next controls below the question; disable Previous on Question 1; on the final question replace Next with Submit Exam; retain a persistent early-submit action in the header/sidebar. Score +1 for each correct answer and 0 for wrong or unanswered. Save only one attempt record and show immediate marks plus question-by-question review.
6. Build a distinctive, responsive interface with navigation, KPIs/charts, explanatory policy content, error/loading/empty states and a locally bundled, credited educational study-desk image that remains available on GitHub Pages.
7. Provide README instructions for Appwrite project/Web Platform CORS setup, auth users and admin label, database/collection attributes and indexes, collection/document security, local configuration, GitHub Actions Pages deployment, and the client-side security caveat.
8. Before the first dev-server start, add `public/manus-routes.json` with the complete client route patterns. Configure host-managed diagnostics for JavaScript/TypeScript before application source edits. Declare Vite's foreground dev command through the managed runtime on port 3000, then verify it is ready and that `/manus-routes.json` returns the intended JSON.
9. Review the finished implementation, resolve actionable diagnostics and build problems, commit intended project files to `main`, fetch/integrate canonical remote changes, push, and verify the recorded checkpoint. Do not publish the website unless separately requested; preview is not publication.

## Project structure

- `src/main.jsx` — React entry, Tailwind CSS import, root render.
- `src/App.jsx` — `HashRouter`, route table and guard composition.
- `src/components/` — reusable shell, navigation, form fields, feedback states, modal, metric cards, question palette and review components.
- `src/pages/` — student login/home/dashboard/exam list/history/live exam/result review and admin login/dashboard views.
- `src/context/` — current session/user provider and role-aware guards.
- `src/lib/` — Appwrite client/config, session/auth helpers, database/query/permission helpers, compact record serialization and formatters.
- `src/styles/` — Tailwind entry and small global exam-mode styles.
- `public/` — favicon/brand assets and `manus-routes.json`.
- project root — `vite.config.js`, Tailwind/PostCSS configuration, `package.json`, lockfile, `.env.example`, `.gitignore`, `README.md`, `plan.md`, and `TODO.md`.

## Design direction

Three possible directions sampled from the low-probability tails: **Swiss academic editorial** (0.08), **quiet campus library** (0.04), **neo-brutalist test station** (0.02). Choose **Swiss academic editorial**: a confident examination tool that feels rigorous and calm rather than punitive or gamified.

- **Design movement:** Swiss editorial / contemporary academic publishing, translated into a clear digital assessment instrument.
- **Core principles:** (1) information hierarchy stays legible under pressure; (2) status is conveyed with both color and text; (3) student and administrator surfaces share a visual language but not the same navigation; (4) controls remain touch-friendly and keyboard-accessible.
- **Color philosophy:** warm paper neutrals reduce glare; deep ink-blue anchors trust and focus; a clear cobalt signature accent marks active decisions; restrained green/rose/stone communicate correct, incorrect, and unanswered states without turning the interface into a game.
- **Layout paradigm:** editorial split composition with a narrow, persistent navigation rail/header and generous asymmetric reading column; the live exam uses a stable question canvas paired with a compact, independently scrollable question-index rail.
- **Signature elements:** a fine cobalt rule that marks the current section; numbered question tiles with crisp status states; soft paper-like panels with hairline dividers.
- **Interaction philosophy:** predictable transitions, visible progress, immediate feedback, no surprise motion; confirm early submission with a custom summary modal; accessible focus and disabled states.
- **Animation:** brief 140–180 ms opacity/translate transitions for page and modal changes; restrained chart drawing; no bouncing or countdown animation that distracts during an exam. Respect reduced-motion preferences.
- **Typography system:** `DM Sans` or a locally safe sans-serif for interface and `DM Serif Display` for selected editorial headings, with system fallbacks; use tabular numerals for timers/scores, clear 12/14/16/24/36 px hierarchy, and comfortable body line-height.
- **Brand essence:** “A clear, accountable place to sit the test and understand the result”; for students and exam administrators; rigorous without feeling hostile. Personality: composed, precise, supportive.
- **Brand voice:** headlines are direct and informative; actions use explicit verbs; policy copy explains consequences in plain language. Examples: “One question at a time. Your progress stays in view.” “Leaving fullscreen ends this attempt.”
- **Wordmark & logo:** an abstract open-page mark formed from two offset rectangles with a small cobalt square/checkpoint; pair with a custom-spaced “Exam Portal” wordmark.
- **Signature brand color:** cobalt `#3157D5`, used sparingly for active navigation, primary actions and the current question.

## Approval request

Please review this approach, especially the static-client security limitation described above. After approval, I will create the detailed `TODO.md`, select and generate any planned visual asset, configure diagnostics and dependencies, implement the portal, and complete the runtime/build/checkpoint workflow. No private Appwrite project IDs or secrets are needed to build the app, but live Appwrite integration cannot be verified until you configure the values in `.env` or GitHub Actions.
