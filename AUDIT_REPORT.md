# VereinsKalender — Audit Report

**Audit date:** 2026-05-27
**Auditor:** Claude (Opus 4.7)
**Project path:** `c:\skripte\public\VereinsKalender`
**Version audited:** `0.1.0` (all packages)
**Scope:** monorepo (`packages/web`, `packages/mobile`, `packages/server`, `packages/shared`), ~6,100 LOC of TypeScript/TSX

> Note on naming: the audit was requested for "Vereinsplaner" but no such project exists under `c:\skripte`. The closest match — and the only schedule-management project in the workspace — is **VereinsKalender**, which is the project audited here.

---

## Executive Summary

VereinsKalender is an ambitious cross-platform schedule manager (web PSA + React Native mobile + optional Node/WS server) with a clean monorepo layout, strong TypeScript types in the shared package, and a working web MVP. The codebase is well-structured for its size, but it is clearly an **early-stage prototype**:

- **Phase 1-2 (single-user web) is functional.** Phase 3 (real-time sync, webhooks, mobile, server) exists as scaffolding but is not wired into the app and contains a number of placeholder implementations.
- **No tests exist at all** — no unit, integration, or end-to-end coverage anywhere in the repo.
- **No authentication, no authorization, no input validation** on the server. The server is unsafe to expose to a network.
- **Documentation is plentiful but duplicative and partially stale** (9 markdown files at the project root, several overlapping).
- **No `LICENSE` file** despite the workspace policy noting AGPLv3+commercial licensing for public projects.

Overall risk classification: **Medium — safe for local single-user use, unsafe for any networked / multi-user deployment in current form.**

---

## 1. Code Quality

### What's working well

- **Strong type model.** `packages/shared/src/types.ts` defines a coherent domain (CalendarEntry, Group, RecurringRule, Holiday, ConflictRule, FilterOptions) with a branded `UUID` type and `Create*Request` DTOs. Both web and mobile depend on it via workspace alias.
- **Clean separation of concerns** in the web package: `storage.ts` (persistence), `hooks.ts` (state), components (UI), `export.ts` (serialization).
- **Consistent React patterns** in the web app: `useCallback`-wrapped mutators, functional `setX(prev => …)` updates, modal/form structure repeated predictably across components.
- **TypeScript strict mode** is enabled in every package's `tsconfig.json` (`strict: true`, plus `noUnusedLocals`/`noUnusedParameters` in web).
- **ICS export** (`packages/web/src/export.ts:13-43`) is RFC 5545-shaped (correct VCALENDAR/VEVENT envelope, CRLF line endings, escaping of `,`, `;`, `\`, newlines).
- **Conflict resolver heuristics** (`packages/server/src/realtime/conflict-resolver.ts`) are conceptually sound: last-writer-wins with version tie-break, plus an "updates to disjoint fields → merge" fast path.

### Issues found

#### CRITICAL (correctness bugs)

| # | File:Line | Issue |
|---|---|---|
| C1 | `packages/web/src/components/ConflictRuleManager.tsx:42` | `id: Math.random().toString(36).substr(2, 9) as UUID` — generates a **9-character non-UUID** and lies to the type system. Every other entity uses `generateUUID()` from shared. Result: IDs are inconsistent and collision-prone. |
| C2 | `packages/web/src/App.tsx:142-148` | `onAddRule` and `onDeleteRule` for ConflictRules just `alert()` "not yet fully implemented" — created rules are **silently dropped**. Same for `onDeleteHoliday` at line 131. Tab UI presents itself as functional. |
| C3 | `packages/web/src/components/EventForm.tsx:34-50` | Form `onSave` payload omits `type` entirely, but `App.tsx:42` hardcodes `type: 'event'`. The form's `isRecurring`/`recurrencePattern` fields are collected but **never persisted** — there is no `addRule()` call after `addEntry()`, and `ruleId` is not set on the entry. Recurrence is a dead UI. |
| C4 | `packages/web/src/storage.ts:97-100` | `deleteGroup` rewrites every entry's groups, but this is done in `Storage.deleteGroup` AND again in `hooks.ts:85-94` after the call. Double traversal; not incorrect but the in-memory `entries` array in `Storage` is mutated while React state is updated separately — drift is possible if a third caller reads `storage.getEntries()` directly. |
| C5 | `packages/shared/src/utils.ts:252-256` | `detectConflicts` passes `rule.condition.endDate` to `isDateInRange` without a null-check (only `startDate` is guarded on line 252). If a rule has `startDate` but no `endDate`, `parseDate(undefined)` produces `Invalid Date` and the comparison silently returns `false` for all entries. |
| C6 | `packages/shared/src/utils.ts:97-180` `expandRule` | YEARLY branch only uses `parsed.bymonth[0]` and `parsed.bymonthday[0]` (ignores any further values), and the loop variable `current` is mutated but only `getUTCFullYear()` is compared — for rules where `startDate.year > year` the loop body still runs once and emits a candidate outside the range. WEEKLY without `BYDAY` does nothing (no fallback). MONTHLY without `BYMONTHDAY` does nothing. |
| C7 | `packages/web/src/realtime.ts:79-81` | `this.ws.onmessage = (event) => this.handleMessage(JSON.parse(event.data));` — no try/catch. A single malformed server frame crashes the WS handler and closes the connection. Server-side has the same shape but at least wraps in try/catch (`server.ts:48-54`). |
| C8 | `packages/server/src/realtime/server.ts:131` and `:160` | `pendingChanges` and `conflictDetections` Maps are **never garbage collected**. Long-running server leaks memory unbounded; ack messages mark entries `'acked'` but don't `delete` them. |
| C9 | `packages/mobile/src/sync/SyncManager.ts:152-158` | `downloadData` **concatenates** local + server arrays instead of merging by id. Each successful sync duplicates every entry, group, rule, holiday, and conflict in AsyncStorage. This is a guaranteed data-corruption bug on first run. |
| C10 | `packages/mobile/src/notifications/NotificationManager.ts:82-86` and `:101-105` | `trigger: { type: 'date', date }` and `{ type: 'daily', hour, minute }` use the new Expo SDK 50+ trigger shape, but the function is typed against `Notifications.NotificationTriggerInput`. Without the `SchedulableTriggerInputTypes.DATE`/`.DAILY` enum values, TypeScript will reject these at build time on stricter Expo configs. |
| C11 | `packages/server/src/jobs/scheduler.ts:27` | Uses deprecated `String.prototype.substr` (already removed from some engines). Same on `ConflictRuleManager.tsx:42`. |
| C12 | `packages/web/src/components/Analytics.tsx:36-38` | Time-of-day analytics use `entry.startDate` which is a date-only string (`YYYY-MM-DD`). `new Date("2026-05-27").getHours()` returns **the local-time offset of UTC midnight** — i.e. always the same number for every entry in a given timezone. "Peak hour" is meaningless. |

#### HIGH

| # | File:Line | Issue |
|---|---|---|
| H1 | `packages/server/src/realtime/server.ts:91-92` | Comment says "Detect conflicts with pending changes" but the conflict detection runs against changes that have already been acked — `pendingChanges` is never cleared (see C8), so eventually every new change conflicts with every historical change. |
| H2 | `packages/server/src/realtime/server.ts:172-179` | `handleSync` returns empty arrays for all entities. There is no server-side persistence layer; the WS server has nothing to sync. The mobile client (`SyncManager.uploadChanges`) POSTs to `/api/sync/upload`, which doesn't exist on the server (`index.ts` has `/health`, `/ws`, `/webhooks/*`, `/events`, `/jobs/schedule`). Mobile sync is broken end-to-end. |
| H3 | `packages/server/src/index.ts:51-53` | `POST /jobs/schedule` accepts `handler` from the request body — this implies arbitrary function injection. As written, `handler` is whatever JSON was sent (likely a string) so it'll fail at runtime, but the API contract is dangerous-by-design (see Security S1). |
| H4 | `packages/server/src/webhooks/manager.ts:38` | `setInterval(() => this.processQueue(), 5000)` is fired in the constructor but `emit()` also calls `processQueue()` directly — concurrent runs are prevented by `this.processingQueue` flag but the interval will run forever even if no events are emitted. No `clearInterval` on shutdown. |
| H5 | `packages/web/src/realtime.ts:362-368` | `document.addEventListener('mousemove', …)` and `keydown` are attached but **never removed** in `stopPresenceTracking`. Repeated connect/disconnect cycles accumulate listeners. Also: a presence update is sent on every mousemove — easy to DDoS the server from a single client. |
| H6 | `packages/web/src/hooks.ts:33-45` | `addEntry({ title, description, startDate, endDate, type, groups, region })` uses object spread `...entry` which lets a caller silently pass extra fields (e.g. `isRecurring` from EventForm, see C3). No schema validation between layers. |
| H7 | `packages/web/src/storage.ts:31-33` | `JSON.parse(stored)` with no schema check. A user editing localStorage by hand (or a corrupted entry from an older schema) crashes the app on next load. No migration mechanism. |
| H8 | `packages/web/src/components/Analytics.tsx:78,89` and `Dashboard.tsx:38` | "Analystics" — spelling mistake repeated in user-facing UI. |
| H9 | `packages/web/vite.config.ts:18` | `minify: false` — this was set deliberately (per CLAUDE.md) to work around a date-fns localizer issue, but ships ~1 MB of unminified JS to every user. Root cause should be fixed and minify re-enabled. |

#### MEDIUM

| # | File:Line | Issue |
|---|---|---|
| M1 | 34 occurrences across 18 files | `any` / `as any` casts — most notable: `App.tsx:36` (`data: any`), `realtime.ts:11` (`data: any` in core type), `manager.ts` various, all mobile screens (`navigation: any`, `route: any`). Erodes the strong typing in shared. |
| M2 | `packages/web/src/storage.ts:54-70` | Linear `findIndex`/`filter` on every CRUD operation. Fine for hundreds of entries, will scale poorly past ~10k as the IMPLEMENTATION_STATUS.md claims. |
| M3 | `packages/web/src/App.tsx:18-29` | Initial filter range is computed on every render (not memoized). Also calls `new Date()` 4 times — values can differ across day boundaries. |
| M4 | `packages/mobile/src/App.tsx:93-94` | `useState(() => new SyncManager())` — singleton-per-mount pattern is fine, but `SyncManager` reads `process.env.REACT_APP_SERVER_URL` at module load (`SyncManager.ts:19`). React Native doesn't expand `process.env` like CRA does without explicit babel-plugin-transform-inline-environment-variables config. Falls back to localhost always. |
| M5 | `packages/web/src/realtime.ts:73,77` and many others | `console.log` left in production code in every module (~60+ calls). Should be replaced with a logger or removed for production. |
| M6 | `packages/web/src/components/CalendarView.tsx:18-46` | Locale hard-coded to `en-US` for a German-language UI ("Kalender", "Gruppen", …). German weekday/month formatting would require `de` from `date-fns/locale`. |
| M7 | `packages/web/src/export.ts:16-17` | `entry.startDate.replace(/-/g, '')` blindly assumes the input is `YYYY-MM-DD`. If a user has ever stored an ISO datetime (`2026-05-27T10:00:00Z`), the resulting `DTSTART;VALUE=DATE:20260527T100000Z` is malformed. |
| M8 | `packages/web/src/export.ts:18` | `new Date(entry.createdAt).toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z'` — fragile; loses information if the underlying timestamp has no millisecond component. |
| M9 | `packages/server/src/webhooks/manager.ts:364` | `const crypto = require('crypto')` inside an ES module. Should be `import * as crypto from 'node:crypto'` at the top. Will fail under strict ESM. |
| M10 | `packages/web/src/components/EventForm.tsx:36-39` | `alert('Bitte Titel und mindestens eine Gruppe eingeben')` — using browser `alert()` and `confirm()` (also in GroupManager, HolidayManager, ConflictRuleManager). Blocks the event loop and looks unpolished. |
| M11 | `packages/web/src/components/HolidayManager.tsx:23` | Default RRULE pattern `FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1` is hard-coded; never updated when user picks `type: 'floating'`. |
| M12 | `packages/mobile/src/screens/EventDetailScreen.tsx:120-141` | Save path writes directly to AsyncStorage with no debounce or optimistic-concurrency check. Two tabs editing the same entry will lose one set of changes. |

#### LOW

| # | Issue |
|---|---|
| L1 | `packages/mobile/src/App.tsx:1` imports `useState`, `useEffect` but `useEffect` is the only one used inline; `useState(() => new …)` is fine. (Not actually an issue, ignore.) |
| L2 | `packages/web/src/components/Analytics.tsx` and `Dashboard.tsx` are imported nowhere — Dashboard exists but is not mounted in `App.tsx`. ~400 LOC of unused code. |
| L3 | `packages/web/src/components/CollaborationIndicators.tsx` likewise unused (no import in App.tsx). |
| L4 | `packages/server/src/index.ts:1-5` imports `expressWs` but doesn't call `expressWs(app)` to install the `.ws()` method. As written, `app.ws('/ws', …)` at line 28 will throw at startup (`app.ws is not a function`). Server has never been started successfully. |
| L5 | `packages/server/src/realtime/server.ts:24-26` constructor receives `app: Express` but never uses it. |
| L6 | `packages/mobile/src/notifications/NotificationManager.ts:155-159` assigns `this.unsubscribe = …` in a method while `private unsubscribe: …` is declared **after** the method on line 161 — works because of hoisting but is poor style. |
| L7 | Inconsistent naming: `recurringRule` vs `rule` vs `ruleId` vs `RecurringRule`; `region` (string) vs `regions: string[]`; `type: EventType` vs `triggerType: ConflictTriggerType`. |
| L8 | No barrel re-exports in `packages/web/src/components` — every consumer imports each component individually. |

---

## 2. Security

> Threat model assumption: the web app is currently runnable as a `file://` single-file bundle (per CLAUDE.md) or via `serve.py`/Vite dev server on localhost. The Node server is not deployed. The mobile app's sync is broken (H2). Findings below are most relevant **if the server is exposed** to any network.

### What's working well

- `.gitignore` correctly lists `.env`, `.env.local`, `*.local.json` (`packages/web/dist/` and `node_modules/` also ignored).
- No credentials or secrets found checked into the repo (verified by grep for `password|secret|token|api_key`).
- Server uses parameterized config types (`SlackNotificationConfig`, `EmailNotificationConfig`) rather than concatenating user input into strings.
- ICS export does proper escaping of `,`, `;`, `\`, newlines (mitigates injection into downstream calendar apps).

### Issues found

#### CRITICAL

| # | File:Line | Severity | Issue |
|---|---|---|---|
| S1 | `packages/server/src/index.ts:33-55` | **Critical** | **No authentication on any endpoint.** Anyone who can reach the server can register webhooks pointing at any URL (turning your server into an SSRF / amplification proxy), emit arbitrary events, schedule cron jobs, and open WebSocket connections claiming any `x-user-id` they send via header (`realtime/server.ts:29`). |
| S2 | `packages/server/src/index.ts:51-55` | **Critical** | `POST /jobs/schedule` takes `name`, `cron`, `handler` from the body. While the JSON `handler` won't actually execute as code (it'll be a string, see `scheduler.ts:38` where it's passed directly to `node-cron`'s callback param), the API exposes arbitrary cron-job creation to anonymous callers. No limits, no auth, no resource cap. |
| S3 | `packages/server/src/index.ts:33-37` | **Critical** | `POST /webhooks/register` accepts any URL with no allow-list. A malicious caller can register `http://169.254.169.254/latest/meta-data/` (AWS metadata service), `file:///etc/passwd`-like axios behaviour, or internal IPs. Combined with `emit()` (line 44) the attacker controls both ends — full SSRF. |
| S4 | `packages/server/src/realtime/server.ts:29-30` | **Critical** | `userId = req.headers['x-user-id'] || generateUUID()` — clients self-assert their identity. There is no way to know who anyone is. Combined with broadcast-everything semantics (`server.ts:247-264`), any WS client receives all changes from all users. |
| S5 | `packages/server/src/webhooks/manager.ts:362-367` | **High** | `generateSignature(event)` does a plain SHA-256 hash of the payload — no secret key. Receivers cannot verify the signature came from this server; the comment "In production, use HMAC-SHA256 with a secret key" admits the implementation is a stub. |

#### HIGH

| # | File:Line | Issue |
|---|---|---|
| S6 | `packages/server/src/index.ts:11` | `app.use(express.json())` with **no body-size limit** (default 100 kB but still exploitable for many small requests). No `helmet`, no `cors`, no `express-rate-limit` middleware. |
| S7 | `packages/server/src/webhooks/integrations/calendar-syncer.ts:47, 95, 127, 154` | OAuth access tokens (`config.accessToken`) are stored in plain-text `IntegrationConfig` objects in memory (`webhooks/manager.ts:30`). There is no encryption at rest, no refresh-token rotation, and no expiry handling. |
| S8 | `packages/server/src/webhooks/manager.ts:38, 179` | `axios.post(webhook.url, …)` follows redirects by default. With user-provided URLs (see S3), an attacker can redirect to internal services. Set `maxRedirects: 0` and validate the resolved IP. |
| S9 | `packages/web/src/storage.ts:30-37` | localStorage stores all calendar data unencrypted, including (potentially) PII in `Group.members: string[]` (emails). On a shared computer this is readable by any user/process with access to the browser profile. The CLAUDE.md mentions DSGVO compliance — emails of identifiable persons need a justification. |
| S10 | `packages/web/src/components/EventForm.tsx:65-99` and analogues | No client-side validation beyond `!title || selectedGroups.length === 0`. Description, member emails, RRULE patterns, region codes go straight through to storage. While the data is local, XSS via stored content is still possible if anyone introduces `dangerouslySetInnerHTML` later (currently none — grep verified) or if the data is ever rendered server-side. |
| S11 | `packages/server/src/webhooks/notifiers/email.ts:46-53` | `to: emailData.recipients.join(',')` — no validation of recipient addresses. Combined with anonymous `/events` POST, the server can be used as an open relay. |
| S12 | `packages/server/src/webhooks/notifiers/email.ts:74-110` | HTML email templates interpolate `eventTitle`, `eventDescription`, etc. directly into the HTML body without escaping. A `<script>` in a title becomes a `<script>` in the recipient's email — most clients neutralize this, but it's still HTML injection. |

#### MEDIUM

| # | Issue |
|---|---|
| S13 | `packages/mobile/src/sync/SyncManager.ts:106-114` POSTs to `${this.serverUrl}/api/sync/upload` over plain `fetch` with no auth header, no TLS check beyond what the platform provides. |
| S14 | `packages/web/src/realtime.ts:69` builds the WS URL with `url.replace(/^http/, 'ws')` — turns `https://` into `wss://` correctly but also turns `http://example.com` into `ws://example.com` even when the page is served over HTTPS (mixed-content / downgrade). |
| S15 | `packages/web/src/components/EventForm.tsx:108` allows `region: ''` (Keine Region). The conflict detector then short-circuits region matching, which may be intentional but is undocumented and lets users opt out of regional rules silently. |
| S16 | No dependency audit. `npm audit` was not run as part of this audit (no shell access for npm), but `react-big-calendar@1.8.5`, `axios@1.6.0`, `express@4.18.0` are old enough to merit a check. `nodemailer` is imported by `email.ts` but not declared in `packages/server/package.json` (missing dependency — install will fail). |

#### LOW

| # | Issue |
|---|---|
| S17 | `serve.py:13-14` binds to all interfaces (`""`) on port 8000. Anyone on the LAN can read the bundle. Use `127.0.0.1` for localhost-only. |
| S18 | `packages/mobile/src/notifications/NotificationManager.ts:25` logs the Expo push token to console. Tokens are not super-sensitive but should not be in production logs. |
| S19 | No Content-Security-Policy header. `packages/web/index.html` is minimal — for production add `<meta http-equiv="Content-Security-Policy" …>` or set it server-side. |

---

## 3. Documentation

### What's working well

- **`README.md`** (top-level) is short and accurate: quickstart, feature list, project structure.
- **`CLAUDE.md`** has useful project-specific notes including the recent date-fns fix narrative and SDK compatibility hints.
- **`VereinsKalender_PLANUNG.md`** is a thorough design document (10 KB) covering the data model and feature roadmap.
- **`IMPLEMENTATION_STATUS.md`** clearly marks Phase 1-2 complete and Phase 3 pending.
- Inline JSDoc comments are present on most public methods of `RealtimeClient`, `SyncManager`, `NotificationManager`, `WebhookManager`, `JobScheduler` (style is `/** description */` above each method).

### Issues found

#### MEDIUM

| # | Issue |
|---|---|
| D1 | **Documentation overload at root.** 9 markdown files (`README.md`, `README_PHASE3.md`, `CLAUDE.md`, `FILES_CREATED.md`, `IMPLEMENTATION_STATUS.md`, `IMPLEMENTATION_SUMMARY.md`, `PHASE_3_CHECKLIST.md`, `PHASE_3_IMPLEMENTATION.md`, `PHASE_3_QUICKSTART.md`, `VereinsKalender_PLANUNG.md`) totaling ~91 KB. Per the workspace memory ("Zeitplaner user inputs" feedback: "plan_*.md: migrate to CLAUDE.md before archiving"), these should be consolidated. The user has explicitly flagged plan-document proliferation as a problem. |
| D2 | **README claims features that don't work.** README.md line 19 lists "Group-based filtering and relevance" and "Local storage with optional Nextcloud integration" — Nextcloud is **not implemented**, only mentioned as "framework in place" in IMPLEMENTATION_STATUS.md:105. Same README also doesn't tell users that mobile is non-functional. |
| D3 | **No API documentation** for the server. The endpoints in `packages/server/src/index.ts` (`/health`, `/ws`, `/webhooks/register`, `/webhooks/:id`, `/events`, `/jobs/schedule`) have no OpenAPI spec, no request/response examples, no curl snippets. |
| D4 | **No setup instructions for the server.** `npm run server:dev` is mentioned in `package.json:19` but no `.env.example`, no required env vars listed, no instructions to install missing `nodemailer` dependency. |
| D5 | **No `LICENSE` file.** Per workspace memory ("Open-source strategy"), public projects should be AGPLv3+commercial. The repository is in `c:\skripte\public\` (i.e. intended to be public) but has no license declaration. Without a license, default copyright applies — nobody can legally use, modify, or redistribute the code. |
| D6 | **CLAUDE.md "Recent Fixes" section** (lines 54-77) admits "DevTools check failed" and "Interactive testing incomplete." Per the workspace memory entry "Error: False verification claims (2026-05-27)" this is the project where the error was logged — good that it was corrected, but the doc still calls itself "Recent Fixes" rather than archiving. |
| D7 | No CONTRIBUTING.md, no code-style guide, no commit-message convention documented. CLAUDE.md references `c:\skripte\private\general stuff\CLAUDE.md` for "git conventions" — that's a private path and won't help external contributors. |
| D8 | `IMPLEMENTATION_STATUS.md:266` claims "Calendar view: <500ms load time for 10k+ entries" — there are no benchmarks in the repo. Marked "tested conceptually" — should be removed or actually benchmarked. |
| D9 | `IMPLEMENTATION_STATUS.md:128-138` lists mobile, real-time sync, webhooks, analytics under "Phase 3 — Next Steps (PENDING)" but the code for all of these **exists** in `packages/server/src/*`, `packages/mobile/src/*`, etc. The status doc is out of date — the work was scaffolded but not integrated. |

#### LOW

| # | Issue |
|---|---|
| D10 | RRULE pattern field in `HolidayManager.tsx` shows users raw RRULE syntax (`FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25`) with no help link to RFC 5545. End users won't know what this means. |
| D11 | German UI strings are mixed with English-only error messages (`'Sync already in progress'`, `'Failed to upload changes'`). Pick one language for the UI layer and stick with it. |
| D12 | `packages/server/src/realtime/conflict-resolver.ts:155-166` `hasCyclicDependency` is a stub that always returns `false`. The JSDoc doesn't mark it as TODO. |

---

## 4. Architecture

### What's working well

- **Monorepo with npm workspaces** (`package.json:6-9`) is the right call for a polyglot stack — although note `packages/mobile` is **not** in the workspaces list (only `web` and `shared`), so `npm install` at root does not install mobile dependencies. This is probably intentional (Expo doesn't always play nicely with hoisting per the memory entry "Expo npm workspaces") but should be documented.
- **Shared types package** (`@vereinskalender/shared`) is the architectural keystone. Both web and mobile import the same types and utilities — exactly the pattern the project's premise requires.
- **Storage abstraction** in web (`storage.ts`) is a thin class with CRUD methods — easy to swap localStorage for IndexedDB, Nextcloud WebDAV, or a remote API.
- **Single-file build** (`vite-plugin-singlefile`) is a clever choice for distribution — users can email the `dist/index.html` and run it without a server. The CLAUDE.md captures the relative-path and IIFE-format adjustments needed.
- **Webhook architecture** (events queued, processed in batches, exponential backoff with jitter) is textbook-good in shape even if the implementation has security gaps.

### Issues found

#### HIGH

| # | Issue |
|---|---|
| A1 | **No clear data ownership boundary between web and mobile.** Web stores in `localStorage` under key `vereinskalender_db`; mobile stores in `AsyncStorage` under key `calendarData`. They are NOT synced (the mobile SyncManager talks to a server endpoint that doesn't exist, see H2). Calling this a "cross-platform" app is misleading — they are two separate apps with the same schema. |
| A2 | **Server is dead code.** The Node server has no persistent store (memory-only), no auth, the WS handler will crash on startup (L4, `expressWs` not installed on the app), and the only endpoint the mobile client tries to call (`/api/sync/upload`) doesn't exist. The 1,400 LOC of server code is a Phase-3 sketch that was never connected. |
| A3 | **No tests.** Zero test files (`*.test.*`, `*.spec.*`) in the repo. For ~6k LOC across three platforms with non-trivial date arithmetic, RRULE expansion, and conflict resolution, the absence of any unit test is a major architectural risk. |
| A4 | **Realtime client and server speak slightly different protocols.** Server's `handleMessage` switches on types `change/presence/ack/sync/resolve` (`server.ts:69-87`) but the client never sends `sync` directly — it sends `change` with `data.operation = 'sync'` (`realtime.ts:228-236`). The server has no branch for that, so the request silently does nothing. |

#### MEDIUM

| # | Issue |
|---|---|
| A5 | **No layered architecture in web.** `App.tsx` directly owns global state, modal flags, filters, and data plumbing. Past ~10 components this will not scale. Consider context + reducer, or pulling state into a store (Zustand / Redux Toolkit). |
| A6 | **`packages/mobile/src/screens/CalendarScreen.tsx:117-123`** filters in the component on every render. Should be in a hook or memoized. Repeated for `GroupsScreen`, `EventDetailScreen`. |
| A7 | **No environment configuration story.** Web has none. Mobile reads `process.env.REACT_APP_SERVER_URL` (won't work in RN without Babel transform — see M4). Server reads `process.env.PORT` / `APP_URL` but no `.env.example`. |
| A8 | **Build output**: `packages/web/dist/index.html` is 1.03 MB unminified. With minification + tree-shaking re-enabled and `react-big-calendar` (~250 kB) trimmed/lazy-loaded, this is plausibly a 250-400 kB bundle. |
| A9 | **Storage is not transactional.** If `localStorage.setItem` throws (quota exceeded), the in-memory `this.db` is already mutated — next read returns stale-in-memory data that won't match what's on disk after reload. |

#### LOW

| # | Issue |
|---|---|
| A10 | Component CSS files (`*.css`) are imported per-component — fine for small apps, but with 10 components × 2 CSS files (component + global) the cascade order is fragile. Consider CSS modules or a tokenized design system. |
| A11 | `packages/web/src/realtime.ts` is in the web package but is purely a WS client — would belong better in a `@vereinskalender/realtime-client` shared package so mobile can use it too. |
| A12 | No CI configuration (no `.github/workflows`, no `.gitlab-ci.yml`, no Husky hooks). Type-check and build are manual. |

---

## Recommendations & Quick Wins

### Quick wins (≤30 min each)

1. **Fix C1 / C11** Replace `Math.random().toString(36).substr(2, 9) as UUID` in `ConflictRuleManager.tsx:42` and `scheduler.ts:27` with `generateUUID()` / a UUID library. `substr` is deprecated.
2. **Fix C5** Add a null check for `rule.condition.endDate` in `packages/shared/src/utils.ts:252`.
3. **Fix L4** Wrap the Express app: `const wsInstance = expressWs(app); const wsApp = wsInstance.app;` — otherwise `app.ws()` throws.
4. **Fix S17** Bind `serve.py` to `127.0.0.1` instead of `""`.
5. **Add LICENSE file** Per workspace memory, AGPLv3 for the public project. One file, no code changes.
6. **Remove "alert/confirm" calls** Replace with non-blocking toast/modal (a single helper would suffice).
7. **Fix typo "Analystics"** in `Analytics.tsx:78` and `Dashboard.tsx:38` — search-and-replace.
8. **Add `.env.example`** in `packages/server/` and `packages/mobile/` listing `PORT`, `APP_URL`, `REACT_APP_SERVER_URL`.
9. **Add `nodemailer` to `packages/server/package.json` dependencies** — `email.ts` imports it but it's not declared.
10. **Remove `console.log` calls from the web bundle** — at minimum guard them behind `if (import.meta.env.DEV)`.

### Medium effort (≤1 day each)

11. **Add a minimal test suite.** Start with `packages/shared/src/utils.ts` — `parseDate`, `formatDate`, `expandRule`, `filterEntries`, `detectConflicts` are pure functions. Use Vitest. Target ≥80% coverage of `shared` before anything else.
12. **Wire EventForm recurrence** (C3) into `addRule` and link the entry via `ruleId`. Or remove the recurrence UI until it's supported end-to-end.
13. **Implement the missing CRUD wires** in App.tsx (C2): `onDeleteHoliday`, `onAddRule`, `onDeleteRule`.
14. **Consolidate root markdown files** (D1). Keep `README.md`, `CLAUDE.md`, `VereinsKalender_PLANUNG.md`; merge the rest into a single `docs/HISTORY.md` or move to a `docs/` folder.
15. **Replace the homebrew RRULE parser** (`utils.ts:46-180`) with `rrule.js` (npm `rrule`). Will eliminate C6 and a class of future bugs.
16. **Decide on the mobile sync story.** Either remove `SyncManager` (and the broken server endpoint references) or implement `/api/sync/upload` + `/api/sync/download` on the server with proper merge-by-id (fixing C9).
17. **Add a localizer for German** (M6) — import `de` from `date-fns/locale` and pass it through `dateFnsLocalizer`.

### Larger initiatives (multi-day)

18. **Add authentication to the server.** At minimum: shared-secret API key for the webhook endpoints, JWT or session cookies for the WS handshake. Drop the `x-user-id` header trust model.
19. **Add SSRF protection to webhook URLs** (S3, S8). Allow-list hosts, resolve and block private IP ranges, set `maxRedirects: 0` on the outbound axios call.
20. **Sign webhooks with HMAC-SHA256** using a per-endpoint secret (S5).
21. **Move from localStorage to IndexedDB or a server-backed store** to fix A1 (cross-device data ownership) and S9 (PII storage). With server storage, the mobile/web sync becomes meaningful.
22. **Set up CI** (A12): GitHub Actions running `npm run type-check`, `npm test`, `npm run build:all` on PR.
23. **Re-enable Vite minification** (H9) by fixing the root cause: instead of `minify: false`, configure `terserOptions: { mangle: { reserved: ['startOfWeek', 'getDay', 'parse'] } }` or just `minify: 'esbuild'` which doesn't have the same mangling issue.

---

## Audit summary table

| Area | Critical | High | Medium | Low | Total |
|---|---:|---:|---:|---:|---:|
| Code quality | 12 | 9 | 12 | 8 | 41 |
| Security | 5 | 7 | 4 | 3 | 19 |
| Documentation | 0 | 0 | 9 | 3 | 12 |
| Architecture | 0 | 4 | 5 | 3 | 12 |
| **Total** | **17** | **20** | **30** | **17** | **84** |

The single highest-impact change is **adding tests for `packages/shared/src/utils.ts`** — it would have caught C5, C6, C12, and probably M7 immediately. The single highest-impact security change is **gating every server endpoint behind authentication** (S1-S4) before any further server work.

---

*End of audit.*
