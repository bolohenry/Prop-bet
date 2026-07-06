# Guest Recovery, Reveal Polish, and Personal Results — Design

## Context

The Wedding Prop Bets app was tested end-to-end and confirmed working (create
event → guest join → survey → wagers → submit → admin scoring → realtime
leaderboard → CSV export). Out of that testing pass, three product gaps were
identified and scoped for building. A fourth candidate — admin score
correction — was investigated and found to already work correctly (clicking a
different answer on an already-resolved question re-scores it live; clicking
the same answer again un-scores it), so it is out of scope for this work.

No email/SMS/push notification delivery mechanisms are in scope for any of
these features — everything is dashboard/UI only.

## 1. Fuzzy name match on join page

**Problem:** `ParticipantJoin.jsx` looks up an existing submission via
`getSubmission()`, which does a case-insensitive **exact** match
(`ilike('display_name', name.trim())`, no wildcards). A returning guest who
types a slightly different name than they originally used (e.g. "Bob" instead
of "Uncle Bob") won't find their submission. Because `checkName()` uses the
same exact-match logic, they aren't blocked either — they can proceed to
submit a **second, duplicate entry** under the new name, silently splitting
their identity across two leaderboard rows.

**Fix:** When the exact-match lookup in `getSubmission()` fails, run a
secondary case-insensitive **substring** check against existing submissions
for this event: does the typed name contain, or is it contained by, an
existing `display_name`? (e.g. `ilike('display_name', '%' + name.trim() +
'%')` OR the reverse containment, checked client-side once both strings are
fetched/lowercased — whichever is simpler to express as a single query.)

- **Exactly one candidate found:** show a confirmation prompt instead of
  proceeding straight to survey/dashboard:
  > Did you mean **Uncle Bob**?
  > [Yes, that's me] [No, continue as "Bob"]
  - "Yes" → route to that submission's dashboard (same as an exact match today).
  - "No" → proceed exactly as today (checkName + survey for a new submission).
- **Zero or multiple candidates found:** skip the prompt, behave exactly as
  today (no behavior change).

**Explicit limitation:** this catches nicknames/partial names, not true typos
("Jonh" vs "John"). Typo-tolerance would need a fuzzy-string library or a
Postgres extension (e.g. `pg_trgm` + similarity scoring), which is more
infrastructure than this problem currently warrants.

**Touch points:** `src/pages/ParticipantJoin.jsx`, `src/lib/api.js`
(`getSubmission`/`checkName` or a new helper alongside them).

## 2. Reveal polish

**Problem:** The live reveal flow (`AdminReveal.jsx` drives it,
`ParticipantLiveReveal.jsx` is what guests watch) already has a 3-2-1
countdown, a "just revealed" answer card, and a running leaderboard — but
there's no celebratory moment when a guest gets something right, and the end
of the reveal is just a small 🎉 with text, dropping straight back into the
normal leaderboard view.

**Fix:**
- **Confetti burst** on `ParticipantLiveReveal.jsx`: when `showResult` becomes
  true and `isCorrect` is true for the just-revealed question, trigger a
  confetti animation over ~1.5s. Scoped to the guest's own screen, tied to
  their own correctness, not a global/shared effect.
- **Winner screen:** when `allRevealed` (i.e. `currentIndex >=
  revealOrder.length - 1`), both `AdminReveal.jsx` and
  `ParticipantLiveReveal.jsx` show a dedicated full-screen moment before
  settling into the normal leaderboard: winner's name/avatar, final score, a
  trophy/crown treatment. Reuses the existing tie-breaker winner logic
  (`event.tie_winner_name`) already computed elsewhere for ties.

**Touch points:** `src/pages/AdminReveal.jsx`,
`src/pages/ParticipantLiveReveal.jsx`, a new small confetti utility/component
(no existing confetti dependency in `package.json` — likely a small
self-contained implementation or a lightweight new dependency, decided during
implementation).

## 3. Personal results list on guest dashboard

**Problem:** `ParticipantDashboard.jsx` currently renders the shared
`AnswerMatrix` component (a wide table, one column per question, one row per
guest) in an "Answer matrix" section. On a real mobile viewport (390px
tested), only ~6 of 12 question columns fit on screen, there's no scroll hint,
and columns are labeled only "Q1"/"Q2" with no adjacent question text —
confirmed via live testing to be hard to parse on the device guests actually
use.

**Fix:** Replace the "Answer matrix" section on `ParticipantDashboard.jsx`
with a new `MyResults` component: a vertical list, one card per scored
question, showing:
- the question text (not just "Q3")
- the guest's own answer
- the correct answer, once resolved
- a ✅/❌ badge once resolved; a neutral "pending" state if not yet scored
- the wager multiplier (2×/3×) if the guest bet on that question

**Explicitly unchanged:**
- The **Leaderboard** section on `ParticipantDashboard.jsx` (ranked list,
  everyone's name + points, who's leading) stays exactly as-is.
- `AnswerMatrix` itself stays exactly as-is on `AdminDashboard.jsx` — this
  change is guest-dashboard-only. The wide multi-guest table still makes
  sense there on admin's larger screen.

**Touch points:** `src/pages/ParticipantDashboard.jsx`, a new
`src/components/MyResults.jsx`.

## Out of scope

- Admin score correction/undo — already works, verified live, no changes.
- Any email, SMS, or push notification delivery for any of the above.
- True typo-tolerant fuzzy matching (see limitation under §1).
