# Guest Recovery, Reveal Polish, and Personal Results Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three independent features for the Wedding Prop Bets app: fuzzy name-match recovery on the join page, confetti + a full-screen winner moment for the live reveal, and a mobile-friendly personal results list on the guest dashboard.

**Architecture:** All three features are additive React components/functions layered onto the existing Vite + React + Supabase app — no schema changes, no new backend endpoints. Two pieces of pure business logic (name-similarity matching, winner computation) are extracted into standalone modules with zero Supabase/React dependencies so they can be unit-tested with Node's built-in test runner. Everything else is UI wiring verified by hand against the local dev server.

**Tech Stack:** React 19, Vite 6, Tailwind CSS v4, Supabase JS client, `sonner` for toasts (already in use). No new npm dependencies are introduced — confetti is a self-contained `<canvas>` component, not a library.

## Global Constraints

- No email, SMS, or push notification delivery — dashboard/UI only (per spec).
- No new npm dependencies (per file-structure decision below — confetti is hand-rolled).
- This repo has **no existing test framework** (`package.json` has only `dev`/`build`/`preview` scripts, no test files anywhere). Do not add Vitest/Jest/Playwright as a project dependency. Use Node's built-in `node --test` + `node:assert` for the two pure-logic modules (zero install required — ships with Node 24, which is what `package.json` already requires via `"engines": { "node": ">=20" }`). Everything else is verified manually against the local dev server, matching the project's existing testing posture.
- Match existing code style exactly: function components, Tailwind utility classes following the existing color tokens (`brand-*`, `accent-*`, `success-*`, `danger-*`, `warn-*`), `toast` from `sonner` for user feedback, no comments unless documenting a non-obvious constraint.
- The admin-side `AnswerMatrix` on `src/pages/AdminDashboard.jsx` and the `Leaderboard` section on `src/pages/ParticipantDashboard.jsx` must NOT change.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/lib/matching.js` | Create | Pure function: is one name a substring-match of another? |
| `src/lib/matching.test.js` | Create | `node --test` unit tests for `isSimilarName` |
| `src/lib/winner.js` | Create | Pure function: compute the event winner from submissions |
| `src/lib/winner.test.js` | Create | `node --test` unit tests for `computeWinner` |
| `src/lib/api.js` | Modify | Add `findSimilarSubmissions(eventId, name)`, built on `matching.js` |
| `src/pages/ParticipantJoin.jsx` | Modify | Wire in the "Did you mean X?" confirmation flow |
| `src/components/Confetti.jsx` | Create | Self-contained canvas confetti burst, no dependencies |
| `src/components/WinnerScreen.jsx` | Create | Full-screen winner announcement, built on `winner.js` |
| `src/pages/ParticipantLiveReveal.jsx` | Modify | Fire confetti on correct answers; show `WinnerScreen` at the end |
| `src/pages/AdminReveal.jsx` | Modify | Show `WinnerScreen` at the end (replacing the plain 🎉 block) |
| `src/components/MyResults.jsx` | Create | Guest's personal per-question results list |
| `src/pages/ParticipantDashboard.jsx` | Modify | Replace `AnswerMatrix` with `MyResults` (this file only) |

---

### Task 1: Pure name-similarity matcher

**Files:**
- Create: `src/lib/matching.js`
- Test: `src/lib/matching.test.js`

**Interfaces:**
- Produces: `isSimilarName(candidateName: string, typedName: string): boolean` — used by Task 3.

- [ ] **Step 1: Write the failing test**

Create `src/lib/matching.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSimilarName } from './matching.js';

test('substring match: typed name is contained in candidate', () => {
  assert.equal(isSimilarName('Uncle Bob', 'Bob'), true);
});

test('substring match: candidate is contained in typed name', () => {
  assert.equal(isSimilarName('Bob', 'Uncle Bob'), true);
});

test('case-insensitive match', () => {
  assert.equal(isSimilarName('UNCLE BOB', 'bob'), true);
});

test('exact match (case-insensitive) returns false — handled separately as an exact match', () => {
  assert.equal(isSimilarName('Uncle Bob', 'uncle bob'), false);
});

test('no relation returns false', () => {
  assert.equal(isSimilarName('Uncle Bob', 'Aunt Sue'), false);
});

test('trims whitespace before comparing', () => {
  assert.equal(isSimilarName('Uncle Bob', '  Bob  '), true);
});

test('empty typed name returns false', () => {
  assert.equal(isSimilarName('Uncle Bob', ''), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/matching.test.js`
Expected: FAIL — `Cannot find module './matching.js'` (file doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/matching.js`:

```js
export function isSimilarName(candidateName, typedName) {
  const a = (candidateName || '').trim().toLowerCase();
  const b = (typedName || '').trim().toLowerCase();
  if (!a || !b) return false;
  if (a === b) return false;
  return a.includes(b) || b.includes(a);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/matching.test.js`
Expected: PASS — all 7 tests green, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/lib/matching.js src/lib/matching.test.js
git commit -m "feat: add pure name-similarity matcher for guest recovery"
```

---

### Task 2: Pure winner computation

**Files:**
- Create: `src/lib/winner.js`
- Test: `src/lib/winner.test.js`

**Interfaces:**
- Consumes: a `submissions` array shaped like Supabase rows — each item has `display_name: string`, `total_points: number`, `submitted_at: string` (ISO timestamp). This matches the shape already returned by `getSubmissions()` in `src/lib/api.js:228`.
- Produces: `computeWinner(submissions: Array, tieWinnerName: string | null): { display_name, total_points, submitted_at, ... } | null` — used by Task 6.

- [ ] **Step 1: Write the failing test**

Create `src/lib/winner.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeWinner } from './winner.js';

test('returns null for empty or missing submissions', () => {
  assert.equal(computeWinner([], null), null);
  assert.equal(computeWinner(null, null), null);
});

test('returns the single submission when there is only one', () => {
  const subs = [{ display_name: 'Bob', total_points: 5, submitted_at: '2026-01-01T00:00:00Z' }];
  assert.equal(computeWinner(subs, null), subs[0]);
});

test('returns the highest scorer when there is no tie', () => {
  const subs = [
    { display_name: 'Bob', total_points: 5, submitted_at: '2026-01-01T00:00:00Z' },
    { display_name: 'Alice', total_points: 9, submitted_at: '2026-01-01T00:00:01Z' },
  ];
  assert.equal(computeWinner(subs, null).display_name, 'Alice');
});

test('breaks ties by earliest submitted_at when no tieWinnerName is given', () => {
  const subs = [
    { display_name: 'Bob', total_points: 9, submitted_at: '2026-01-01T00:00:05Z' },
    { display_name: 'Alice', total_points: 9, submitted_at: '2026-01-01T00:00:01Z' },
  ];
  assert.equal(computeWinner(subs, null).display_name, 'Alice');
});

test('prefers the explicit tieWinnerName over score/date sorting', () => {
  const subs = [
    { display_name: 'Bob', total_points: 9, submitted_at: '2026-01-01T00:00:05Z' },
    { display_name: 'Alice', total_points: 9, submitted_at: '2026-01-01T00:00:01Z' },
  ];
  assert.equal(computeWinner(subs, 'Bob').display_name, 'Bob');
});

test('falls back to score/date sorting if tieWinnerName does not match any submission', () => {
  const subs = [
    { display_name: 'Bob', total_points: 9, submitted_at: '2026-01-01T00:00:05Z' },
    { display_name: 'Alice', total_points: 9, submitted_at: '2026-01-01T00:00:01Z' },
  ];
  assert.equal(computeWinner(subs, 'Someone Else').display_name, 'Alice');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/winner.test.js`
Expected: FAIL — `Cannot find module './winner.js'` (file doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/winner.js`:

```js
export function computeWinner(submissions, tieWinnerName) {
  if (!submissions || submissions.length === 0) return null;

  if (tieWinnerName) {
    const found = submissions.find(s => s.display_name === tieWinnerName);
    if (found) return found;
  }

  const sorted = [...submissions].sort((a, b) =>
    b.total_points - a.total_points || new Date(a.submitted_at) - new Date(b.submitted_at)
  );
  return sorted[0];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/winner.test.js`
Expected: PASS — all 6 tests green, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/lib/winner.js src/lib/winner.test.js
git commit -m "feat: add pure winner-computation helper for reveal polish"
```

---

### Task 3: `findSimilarSubmissions` in the API layer

**Files:**
- Modify: `src/lib/api.js` (add after `getSubmission`, which ends at `src/lib/api.js:226`)

**Interfaces:**
- Consumes: `isSimilarName` from `src/lib/matching.js` (Task 1).
- Produces: `findSimilarSubmissions(eventId: string, name: string): Promise<Array<{ display_name: string }>>` — used by Task 4.

- [ ] **Step 1: Add the import**

In `src/lib/api.js`, the file currently starts with:

```js
import { supabase } from './supabase';
import { DEFAULT_QUESTIONS } from '../../shared/questions.js';
import { computeTieBreakerWinner } from '../../shared/tiebreaker.js';
```

Change it to:

```js
import { supabase } from './supabase';
import { DEFAULT_QUESTIONS } from '../../shared/questions.js';
import { computeTieBreakerWinner } from '../../shared/tiebreaker.js';
import { isSimilarName } from './matching.js';
```

- [ ] **Step 2: Add the function**

In `src/lib/api.js`, find `getSubmission` (currently at line 218-226):

```js
export async function getSubmission(eventId, name) {
  const { data } = await supabase
    .from('submissions')
    .select('*')
    .eq('event_id', eventId)
    .ilike('display_name', name.trim())
    .single();
  return data || null;
}
```

Add this function immediately after it:

```js
export async function findSimilarSubmissions(eventId, name) {
  const { data } = await supabase
    .from('submissions')
    .select('display_name')
    .eq('event_id', eventId);
  if (!data) return [];
  return data.filter(s => isSimilarName(s.display_name, name));
}
```

- [ ] **Step 3: Verify manually against the dev server**

Run: `npm run dev` (from `C:\Users\boloh\Prop-bet`), note the printed local URL (e.g. `http://localhost:5173`).

In a browser:
1. Go to `<dev-url>/admin/create`, click "Start from scratch", name the event "Matching Check", click "Create event".
2. Copy the invite link from the result screen, open it in a new tab.
3. Enter name "Uncle Bob", pick any avatar, click Continue, answer all questions with any values, click "Next: Place Your Wagers", click "Submit my bets".
4. Open the invite link again in a fresh private/incognito window (so there's no `sessionStorage` for this event).
5. Open the browser console and run:
   ```js
   import('/src/lib/api.js').then(async api => {
     const event = await api.getEventByInvite(location.pathname.split('/')[2]);
     console.log(await api.findSimilarSubmissions(event.id, 'Bob'));
   });
   ```
   Expected: logs `[{ display_name: 'Uncle Bob' }]`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api.js
git commit -m "feat: add findSimilarSubmissions to the API layer"
```

---

### Task 4: Wire the "Did you mean X?" flow into the join page

**Files:**
- Modify: `src/pages/ParticipantJoin.jsx`

**Interfaces:**
- Consumes: `findSimilarSubmissions` from `src/lib/api.js` (Task 3).

- [ ] **Step 1: Update imports and add state**

Current top of `src/pages/ParticipantJoin.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventByInvite, checkName, getSubmission } from '../lib/api';
import PageTitle from '../components/PageTitle';
import AvatarPicker from '../components/AvatarPicker';
import { LoadingPage } from '../components/Skeleton';

export default function ParticipantJoin() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
```

Replace with:

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventByInvite, checkName, getSubmission, findSimilarSubmissions } from '../lib/api';
import PageTitle from '../components/PageTitle';
import AvatarPicker from '../components/AvatarPicker';
import { LoadingPage } from '../components/Skeleton';

export default function ParticipantJoin() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
```

- [ ] **Step 2: Replace `handleContinue` with the fuzzy-match-aware version**

Current `handleContinue` (the whole function):

```jsx
  async function handleContinue(e) {
    e.preventDefault();
    setError('');
    const name = displayName.trim();
    if (!name) { setError('Please enter your name.'); return; }

    setChecking(true);
    try {
      const existing = await getSubmission(event.id, name);
      if (existing) {
        sessionStorage.setItem(`wpb_name_${event.id}`, name);
        if (avatar) sessionStorage.setItem(`wpb_avatar_${event.id}`, avatar);
        navigate(`/i/${inviteCode}/dashboard`);
        return;
      }
    } catch {}

    try {
      const { taken } = await checkName(event.id, name);
      if (taken) {
        setError('That name is taken — try a different one, or use the exact name you submitted with to view your dashboard.');
        setChecking(false);
        return;
      }
    } catch (err) {
      setError(err.message);
      setChecking(false);
      return;
    }

    sessionStorage.setItem(`wpb_name_${event.id}`, name);
    if (avatar) sessionStorage.setItem(`wpb_avatar_${event.id}`, avatar);
    navigate(`/i/${inviteCode}/survey`, { state: { displayName: name, avatar, event } });
  }
```

Replace with:

```jsx
  function routeToExistingDashboard(existingName) {
    sessionStorage.setItem(`wpb_name_${event.id}`, existingName);
    if (avatar) sessionStorage.setItem(`wpb_avatar_${event.id}`, avatar);
    navigate(`/i/${inviteCode}/dashboard`);
  }

  async function proceedAsNewName(name) {
    try {
      const { taken } = await checkName(event.id, name);
      if (taken) {
        setError('That name is taken — try a different one, or use the exact name you submitted with to view your dashboard.');
        setChecking(false);
        return;
      }
    } catch (err) {
      setError(err.message);
      setChecking(false);
      return;
    }

    sessionStorage.setItem(`wpb_name_${event.id}`, name);
    if (avatar) sessionStorage.setItem(`wpb_avatar_${event.id}`, avatar);
    navigate(`/i/${inviteCode}/survey`, { state: { displayName: name, avatar, event } });
  }

  async function handleContinue(e) {
    e.preventDefault();
    setError('');
    const name = displayName.trim();
    if (!name) { setError('Please enter your name.'); return; }

    setChecking(true);
    try {
      const existing = await getSubmission(event.id, name);
      if (existing) {
        routeToExistingDashboard(existing.display_name);
        return;
      }
    } catch {}

    try {
      const similar = await findSimilarSubmissions(event.id, name);
      if (similar.length === 1) {
        setSuggestion(similar[0].display_name);
        setChecking(false);
        return;
      }
    } catch {}

    await proceedAsNewName(name);
  }

  function confirmSuggestion() {
    routeToExistingDashboard(suggestion);
  }

  function dismissSuggestion() {
    const name = displayName.trim();
    setSuggestion(null);
    setChecking(true);
    proceedAsNewName(name);
  }
```

- [ ] **Step 3: Render the confirmation prompt instead of the form when a suggestion exists**

Current render block (inside the `event.status !== 'open'` else-branch):

```jsx
          <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 sm:p-8">
            <p className="text-brand-300 text-sm mb-6">Place your bets and see how you stack up.</p>
            <form onSubmit={handleContinue} className="space-y-5">
```

Change to:

```jsx
          <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 sm:p-8">
            {suggestion ? (
              <div className="text-center space-y-5">
                <p className="text-brand-200 text-base">
                  Did you mean <span className="font-bold text-white">{suggestion}</span>?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={confirmSuggestion}
                    className="flex-1 bg-brand-600 hover:bg-accent-500 text-white py-3.5 rounded-xl text-sm font-bold transition-all duration-200"
                  >
                    Yes, that's me
                  </button>
                  <button
                    onClick={dismissSuggestion}
                    className="flex-1 bg-white/[0.06] border border-white/[0.1] text-brand-200 py-3.5 rounded-xl text-sm font-bold transition-all duration-200"
                  >
                    No, continue as "{displayName.trim()}"
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-brand-300 text-sm mb-6">Place your bets and see how you stack up.</p>
                <form onSubmit={handleContinue} className="space-y-5">
```

And its matching closing tags — current end of the form block:

```jsx
              <button
                type="submit"
                disabled={checking}
                className="w-full bg-brand-600 hover:bg-accent-500 text-white py-4 rounded-xl text-base font-bold transition-all duration-200 disabled:opacity-50 shadow-lg shadow-brand-900/40 hover:shadow-accent-500/30"
              >
                {checking ? 'Checking...' : 'Continue'}
              </button>
            </form>
          </div>
```

Change to:

```jsx
              <button
                type="submit"
                disabled={checking}
                className="w-full bg-brand-600 hover:bg-accent-500 text-white py-4 rounded-xl text-base font-bold transition-all duration-200 disabled:opacity-50 shadow-lg shadow-brand-900/40 hover:shadow-accent-500/30"
              >
                {checking ? 'Checking...' : 'Continue'}
              </button>
                </form>
              </>
            )}
          </div>
```

- [ ] **Step 4: Verify manually against the dev server**

Run: `npm run dev` (from `C:\Users\boloh\Prop-bet`), note the printed local URL.

In a browser:
1. Go to `<dev-url>/admin/create`, click "Start from scratch", name it "Fuzzy Join Check", create it, copy the invite link.
2. Open the invite link, join as "Uncle Bob", answer all questions, submit.
3. Open the invite link again in a fresh private/incognito window.
4. Type "Bob" as the name, click Continue.
   Expected: the form is replaced by "Did you mean **Uncle Bob**?" with two buttons.
5. Click "Yes, that's me".
   Expected: navigates to `/i/:inviteCode/dashboard` showing "Locked in as Uncle Bob".
6. Go back to the join page, type "Bob" again, click Continue, then click `No, continue as "Bob"`.
   Expected: proceeds to the survey as a new participant named "Bob" (survey page loads, "Playing as Bob" shown).
7. Type a name with no relation, e.g. "Zzyzx", click Continue.
   Expected: proceeds straight to the survey with no prompt (no similar name exists).

- [ ] **Step 5: Commit**

```bash
git add src/pages/ParticipantJoin.jsx
git commit -m "feat: suggest existing submission on partial name match at join"
```

---

### Task 5: Confetti component

**Files:**
- Create: `src/components/Confetti.jsx`

**Interfaces:**
- Produces: `<Confetti fire={boolean} />` — a self-contained canvas overlay that bursts once each time `fire` transitions from `false`/`undefined` to `true`, and unmounts its animation after ~1.5s. Used by Task 7.

- [ ] **Step 1: Write the component**

Create `src/components/Confetti.jsx`:

```jsx
import { useEffect, useRef } from 'react';

const COLORS = ['#7c3aed', '#f472b6', '#22c55e', '#f59e0b', '#38bdf8'];

export default function Confetti({ fire }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!fire) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 120 }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 3,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -10 - 4,
      size: Math.random() * 6 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      spin: (Math.random() - 0.5) * 20,
    }));

    const start = Date.now();
    const duration = 1500;

    function tick() {
      const elapsed = Date.now() - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.vy += 0.35;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }

      if (elapsed < duration) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [fire]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  );
}
```

- [ ] **Step 2: Verify manually against the dev server**

Run: `npm run dev` (from `C:\Users\boloh\Prop-bet`).

Create a scratch route check by temporarily adding `<Confetti fire={true} />` inside the return of `src/pages/Home.jsx` (any existing page works), reload the page in a browser.
Expected: on page load, ~120 small colored squares burst upward from the center-ish of the screen, fall under gravity, and clear away within ~1.5s. No console errors.

Remove the temporary `<Confetti fire={true} />` line from `Home.jsx` before continuing (this was a throwaway check, not part of the feature).

- [ ] **Step 3: Commit**

```bash
git add src/components/Confetti.jsx
git commit -m "feat: add self-contained confetti burst component"
```

---

### Task 6: WinnerScreen component

**Files:**
- Create: `src/components/WinnerScreen.jsx`

**Interfaces:**
- Consumes: `computeWinner` from `src/lib/winner.js` (Task 2).
- Produces: `<WinnerScreen submissions={Array} tieWinnerName={string|null} />` — renders `null` if there's no winner to show (e.g. no submissions). Used by Tasks 7 and 8.

- [ ] **Step 1: Write the component**

Create `src/components/WinnerScreen.jsx`:

```jsx
import { computeWinner } from '../lib/winner';

export default function WinnerScreen({ submissions, tieWinnerName }) {
  const winner = computeWinner(submissions, tieWinnerName);
  if (!winner) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-accent-900 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="text-7xl mb-6">🏆</div>
        <p className="text-brand-300 text-sm font-bold uppercase tracking-wider mb-2">Winner</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight">
          {winner.avatar && <span className="mr-2">{winner.avatar}</span>}
          {winner.display_name}
        </h1>
        <p className="text-accent-300 text-2xl font-bold">{winner.total_points} points</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify manually against the dev server**

Run: `npm run dev` (from `C:\Users\boloh\Prop-bet`).

Temporarily add this to the top of `src/pages/Home.jsx`'s return (throwaway check):
```jsx
<WinnerScreen submissions={[{ display_name: 'Uncle Bob', total_points: 7 }]} tieWinnerName={null} />
```
(and a matching `import WinnerScreen from '../components/WinnerScreen';`)

Reload the page.
Expected: full-screen dark purple gradient, a trophy emoji, "WINNER" label, "Uncle Bob" in large bold text, "7 points" below it.

Remove both the import and the temporary JSX from `Home.jsx` before continuing.

- [ ] **Step 3: Commit**

```bash
git add src/components/WinnerScreen.jsx
git commit -m "feat: add full-screen winner announcement component"
```

---

### Task 7: Wire Confetti + WinnerScreen into the participant live reveal

**Files:**
- Modify: `src/pages/ParticipantLiveReveal.jsx`

**Interfaces:**
- Consumes: `<Confetti fire={boolean} />` (Task 5), `<WinnerScreen submissions tieWinnerName />` (Task 6).

- [ ] **Step 1: Add imports**

Current top of `src/pages/ParticipantLiveReveal.jsx`:

```jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventByInvite, getQuestions, deriveScoredQuestions, getSubmission } from '../lib/api';
import { useRealtimeDashboard } from '../lib/useRealtimeDashboard';
import PageTitle from '../components/PageTitle';
import Leaderboard from '../components/Leaderboard';
import { LoadingPage } from '../components/Skeleton';
```

Replace with:

```jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventByInvite, getQuestions, deriveScoredQuestions, getSubmission } from '../lib/api';
import { useRealtimeDashboard } from '../lib/useRealtimeDashboard';
import PageTitle from '../components/PageTitle';
import Leaderboard from '../components/Leaderboard';
import Confetti from '../components/Confetti';
import WinnerScreen from '../components/WinnerScreen';
import { LoadingPage } from '../components/Skeleton';
```

- [ ] **Step 2: Add `showWinner` state, computed before any early return**

The component already computes `revealOrder`, `currentIndex`, and `isActive` *before* its early returns (`if (loading) return ...` / `if (!event) return null` / `if (!isActive) return ...`), and already has a `useEffect` there (the one that manages `showResult`) — that's the correct place to add more state/effects, since React hooks must run unconditionally on every render, and nothing after those early returns is guaranteed to run.

Current (lines 15-16 and 48-59):

```jsx
  const [prevIndex, setPrevIndex] = useState(-1);
  const [showResult, setShowResult] = useState(false);
```

```jsx
  const revealOrder = event?.reveal_order || [];
  const currentIndex = event?.current_reveal_index ?? -1;
  const isActive = event?.reveal_mode;

  useEffect(() => {
    if (currentIndex > prevIndex) {
      setShowResult(false);
      const timer = setTimeout(() => setShowResult(true), 500);
      setPrevIndex(currentIndex);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, prevIndex]);

  if (loading) return <LoadingPage dark />;
  if (!event) return null;
```

Replace with:

```jsx
  const [prevIndex, setPrevIndex] = useState(-1);
  const [showResult, setShowResult] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
```

```jsx
  const revealOrder = event?.reveal_order || [];
  const currentIndex = event?.current_reveal_index ?? -1;
  const isActive = event?.reveal_mode;
  const allRevealed = revealOrder.length > 0 && currentIndex >= revealOrder.length - 1;

  useEffect(() => {
    if (currentIndex > prevIndex) {
      setShowResult(false);
      const timer = setTimeout(() => setShowResult(true), 500);
      setPrevIndex(currentIndex);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, prevIndex]);

  useEffect(() => {
    if (allRevealed && showResult) {
      const timer = setTimeout(() => setShowWinner(true), 2500);
      return () => clearTimeout(timer);
    }
    setShowWinner(false);
  }, [allRevealed, showResult]);

  if (loading) return <LoadingPage dark />;
  if (!event) return null;
```

This keeps the last question's own reveal (its "You got it right!"/confetti moment) visible for 2.5s before switching to the winner screen — it does not short-circuit straight to `WinnerScreen` the instant the last answer is shown.

- [ ] **Step 3: Render `WinnerScreen` once `showWinner` is true**

Current (immediately after the `if (!isActive)` block):

```jsx
  const currentKey = revealOrder[currentIndex];
```

Replace with:

```jsx
  if (showWinner) {
    return <WinnerScreen submissions={submissions} tieWinnerName={event.tie_winner_name} />;
  }

  const currentKey = revealOrder[currentIndex];
```

- [ ] **Step 4: Fire confetti on a correct reveal**

Current JSX for the result block:

```jsx
              {showResult && currentOutcome?.resolved && (
                <div className={`mt-4 rounded-xl p-4 ${isCorrect ? 'bg-success-500/20' : 'bg-danger-500/20'}`}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: isCorrect ? '#22c55e' : '#ef4444' }}>
                    {isCorrect ? 'You got it right!' : 'Not this time'}
                  </p>
                  <p className="text-white font-extrabold text-xl">{currentOutcome.answer}</p>
                </div>
              )}
```

Replace with:

```jsx
              {showResult && currentOutcome?.resolved && (
                <div className={`mt-4 rounded-xl p-4 ${isCorrect ? 'bg-success-500/20' : 'bg-danger-500/20'}`}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: isCorrect ? '#22c55e' : '#ef4444' }}>
                    {isCorrect ? 'You got it right!' : 'Not this time'}
                  </p>
                  <p className="text-white font-extrabold text-xl">{currentOutcome.answer}</p>
                </div>
              )}
              <Confetti fire={showResult && isCorrect} />
```

- [ ] **Step 5: Verify manually against the dev server**

Run: `npm run dev` (from `C:\Users\boloh\Prop-bet`).

In a browser:
1. Create an event, join as a guest, answer all questions (note your answers), submit.
2. As admin, score every scored question — for at least one question, score it to match what the guest answered (so it'll show correct), and for at least one, score it to NOT match (incorrect). Make sure the LAST question in reveal order (the last scored question) is one you scored to MATCH the guest's answer, so you can observe the confetti-then-winner-screen transition clearly.
3. As admin, go to `/admin/:adminCode/reveal` (or the Reveal link from the dashboard), click "Start Live Reveal".
4. As the guest, open `/i/:inviteCode/reveal`.
5. As admin, click "Reveal Question 1" through all questions except the last, one at a time, waiting for the countdown each time.
   Expected: on the guest screen, for questions you scored to match the guest's answer, a confetti burst plays over ~1.5s after the countdown; for mismatched ones, no confetti plays, just the red "Not this time" card. The screen does NOT switch to a winner screen after any of these — only after the last one.
6. As admin, click "Reveal Question N" for the final question.
   Expected: on the guest screen, the countdown plays, then the final question's answer card appears (with confetti, since you scored it to match) — it stays visible for about 2.5 seconds — and only then does the screen switch to the full-screen `WinnerScreen` (trophy, winner name, points).

- [ ] **Step 6: Commit**

```bash
git add src/pages/ParticipantLiveReveal.jsx
git commit -m "feat: add confetti and winner screen to participant live reveal"
```

---

### Task 8: Wire WinnerScreen into the admin reveal

**Files:**
- Modify: `src/pages/AdminReveal.jsx`

**Interfaces:**
- Consumes: `<WinnerScreen submissions tieWinnerName />` (Task 6).

- [ ] **Step 1: Add the import**

Current top of `src/pages/AdminReveal.jsx`:

```jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getEventByAdmin, getQuestions, setRevealMode, revealNext, deriveScoredQuestions } from '../lib/api';
import { useRealtimeDashboard } from '../lib/useRealtimeDashboard';
import PageTitle from '../components/PageTitle';
import Leaderboard from '../components/Leaderboard';
import { LoadingPage } from '../components/Skeleton';
```

Replace with:

```jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getEventByAdmin, getQuestions, setRevealMode, revealNext, deriveScoredQuestions } from '../lib/api';
import { useRealtimeDashboard } from '../lib/useRealtimeDashboard';
import PageTitle from '../components/PageTitle';
import Leaderboard from '../components/Leaderboard';
import WinnerScreen from '../components/WinnerScreen';
import { LoadingPage } from '../components/Skeleton';
```

- [ ] **Step 2: Replace the "all revealed" block with WinnerScreen, with a way back to admin controls**

Current block:

```jsx
            {allRevealed && countdown === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-xl font-extrabold text-white mb-2">All questions revealed!</p>
                <button onClick={handleStop} className="mt-4 px-6 py-3 bg-white/10 hover:bg-white/20 text-brand-200 rounded-xl font-semibold transition-colors">
                  End Reveal Mode
                </button>
              </div>
            )}

            <div className="pt-4">
              <Leaderboard submissions={submissions} outcomes={outcomes} winnerName={event.tie_winner_name} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

Replace with:

```jsx
            {allRevealed && countdown === 0 && (
              <div className="text-center py-8">
                <button onClick={handleStop} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-brand-200 rounded-xl font-semibold transition-colors">
                  End Reveal Mode
                </button>
              </div>
            )}

            {!allRevealed && (
              <div className="pt-4">
                <Leaderboard submissions={submissions} outcomes={outcomes} winnerName={event.tie_winner_name} />
              </div>
            )}
          </div>
        )}

        {isActive && allRevealed && countdown === 0 && (
          <div className="mt-8">
            <WinnerScreen submissions={submissions} tieWinnerName={event.tie_winner_name} />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify manually against the dev server**

Run: `npm run dev` (from `C:\Users\boloh\Prop-bet`).

In a browser:
1. Create an event, join as one guest, answer all questions, submit.
2. As admin, score every scored question.
3. Go to `/admin/:adminCode/reveal`, click "Start Live Reveal", then click "Reveal Question N" repeatedly (waiting for each countdown) until every question is revealed.
   Expected: after the last question, the admin screen shows the full `WinnerScreen` (trophy, winner name, points) below the reveal controls, with an "End Reveal Mode" button still available above it.
4. Click "End Reveal Mode".
   Expected: returns to the "Start Live Reveal" screen (reveal mode off).

- [ ] **Step 4: Commit**

```bash
git add src/pages/AdminReveal.jsx
git commit -m "feat: add winner screen to admin reveal"
```

---

### Task 9: MyResults component

**Files:**
- Create: `src/components/MyResults.jsx`

**Interfaces:**
- Consumes: nothing new — takes plain props.
- Produces: `<MyResults scoredQuestions={Array} answers={Object} outcomeMap={Object} wager3xKey={string|null} wager2xKey={string|null} />`. Used by Task 10.
  - `scoredQuestions`: array shaped like `deriveScoredQuestions(questions)` output — each item has `question_key`, `label`, `number` (already how `ParticipantDashboard.jsx` calls it at line 54).
  - `answers`: the guest's own `submission.answers` object (`{ [question_key]: answerString }`).
  - `outcomeMap`: `{ [question_key]: { answer, resolved } }` — already how `ParticipantDashboard.jsx` builds `outcomeMap` at lines 60-63.
  - `wager3xKey` / `wager2xKey`: `submission.wager_3x` / `submission.wager_2x` (question_key strings or null).

- [ ] **Step 1: Write the component**

Create `src/components/MyResults.jsx`:

```jsx
export default function MyResults({ scoredQuestions, answers, outcomeMap, wager3xKey, wager2xKey }) {
  if (!scoredQuestions || scoredQuestions.length === 0) {
    return <p className="text-gray-400 text-sm">No scored questions yet.</p>;
  }

  return (
    <div className="space-y-2">
      {scoredQuestions.map(q => {
        const myAnswer = answers?.[q.question_key];
        const outcome = outcomeMap?.[q.question_key];
        const isResolved = outcome?.resolved;
        const isCorrect = isResolved && outcome.answer === myAnswer;
        const wagerLabel = wager3xKey === q.question_key ? '3×' : wager2xKey === q.question_key ? '2×' : null;

        return (
          <div
            key={q.question_key}
            className={`rounded-xl p-4 border ${
              isResolved
                ? isCorrect
                  ? 'bg-success-50/60 border-success-200'
                  : 'bg-gray-50 border-gray-100'
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-gray-800 flex-1">
                Q{q.number}. {q.label}
                {wagerLabel && <span className="ml-1.5 text-accent-500 text-xs font-bold">{wagerLabel}</span>}
              </p>
              {isResolved ? (
                <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${isCorrect ? 'bg-success-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap bg-gray-100 text-gray-400">
                  Pending
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <p className="text-gray-500">Your answer: <span className="font-semibold text-gray-800">{myAnswer || '—'}</span></p>
              {isResolved && (
                <p className="text-gray-500">Correct answer: <span className="font-semibold text-gray-800">{outcome.answer}</span></p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify manually against the dev server**

Run: `npm run dev` (from `C:\Users\boloh\Prop-bet`).

Temporarily add this to the top of `src/pages/Home.jsx`'s return (throwaway check), with a matching `import MyResults from '../components/MyResults';`:

```jsx
<MyResults
  scoredQuestions={[
    { question_key: 'q3', label: 'Will there be a neon sign?', number: 1 },
    { question_key: 'q4', label: 'Will there be a photo booth?', number: 2 },
  ]}
  answers={{ q3: 'Yes', q4: 'Yes' }}
  outcomeMap={{ q3: { answer: 'Yes', resolved: true }, q4: { answer: 'No', resolved: false } }}
  wager3xKey="q3"
  wager2xKey={null}
/>
```

Reload the page.
Expected: two cards. Q1 (neon sign) shows a green "✓ Correct" badge, "Your answer: Yes", "Correct answer: Yes", and a "3×" marker next to the question text. Q2 (photo booth) shows a gray "Pending" badge and only "Your answer: Yes" (no correct-answer line, since it's unresolved).

Remove both the import and the temporary JSX from `Home.jsx` before continuing.

- [ ] **Step 3: Commit**

```bash
git add src/components/MyResults.jsx
git commit -m "feat: add personal per-question results list component"
```

---

### Task 10: Replace AnswerMatrix with MyResults on the guest dashboard

**Files:**
- Modify: `src/pages/ParticipantDashboard.jsx`

**Interfaces:**
- Consumes: `<MyResults scoredQuestions answers outcomeMap wager3xKey wager2xKey />` (Task 9).

- [ ] **Step 1: Swap the import**

Current top of `src/pages/ParticipantDashboard.jsx`:

```jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEventByInvite, getSubmission, getQuestions, deriveSurveyQuestions, deriveScoredQuestions } from '../lib/api';
import { useRealtimeDashboard } from '../lib/useRealtimeDashboard';
import PageTitle from '../components/PageTitle';
import Leaderboard from '../components/Leaderboard';
import AnswerMatrix from '../components/AnswerMatrix';
import ShareButton from '../components/ShareButton';
import { LoadingPage } from '../components/Skeleton';
```

Replace with:

```jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEventByInvite, getSubmission, getQuestions, deriveSurveyQuestions, deriveScoredQuestions } from '../lib/api';
import { useRealtimeDashboard } from '../lib/useRealtimeDashboard';
import PageTitle from '../components/PageTitle';
import Leaderboard from '../components/Leaderboard';
import MyResults from '../components/MyResults';
import ShareButton from '../components/ShareButton';
import { LoadingPage } from '../components/Skeleton';
```

- [ ] **Step 2: Replace the "Answer matrix" section**

Current block:

```jsx
        {submissions && (
          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3 tracking-tight">Answer matrix</h2>
            <AnswerMatrix submissions={submissions} outcomes={outcomes} scoredQuestions={scoredQuestions} />
          </section>
        )}
```

Replace with:

```jsx
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-3 tracking-tight">Your results</h2>
          <MyResults
            scoredQuestions={scoredQuestions}
            answers={submission.answers}
            outcomeMap={outcomeMap}
            wager3xKey={submission.wager_3x}
            wager2xKey={submission.wager_2x}
          />
        </section>
```

(Note: this drops the `{submissions && ...}` guard that wrapped `AnswerMatrix` — `MyResults` only needs `submission`/`scoredQuestions`/`outcomeMap`, all of which are already guaranteed non-null by the earlier `if (!event || !submission) return null;` guard at line 58, so no equivalent guard is needed here.)

- [ ] **Step 3: Verify manually against the dev server**

Run: `npm run dev` (from `C:\Users\boloh\Prop-bet`).

In a browser, at a mobile viewport (e.g. open DevTools, toggle device toolbar, pick an iPhone preset):
1. Create an event, join as a guest, answer all questions, submit.
2. On the resulting guest dashboard, confirm the "Leaderboard" section still renders exactly as before (ranked list, points, medal for 1st place).
3. Confirm the section below it is now titled "Your results" and shows one card per scored question, each readable without any horizontal scrolling, with the full question text visible (not just "Q3").
4. As admin (separate tab), score a couple of questions.
5. Back on the guest dashboard (same tab, no reload needed — this is realtime), confirm the corresponding cards in "Your results" update live to show ✓/✗ badges and the correct answer.
6. Confirm `/admin/:adminCode` (the admin dashboard) still shows the original wide "Answer matrix" table unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/pages/ParticipantDashboard.jsx
git commit -m "feat: show personal results list instead of answer matrix on guest dashboard"
```

---

## Self-Review Notes

- **Spec coverage:** §1 (fuzzy match) → Tasks 1, 3, 4. §2 (confetti + winner screen) → Tasks 2, 5, 6, 7, 8. §3 (personal results list) → Tasks 9, 10. All three spec sections have tasks; "out of scope" items (score correction, any notification delivery, true typo tolerance) have no tasks, correctly.
- **Placeholder scan:** no TBD/TODO; every step has complete, runnable code or an exact manual-verification script.
- **Type/name consistency:** `isSimilarName` (Task 1) is imported and used with that exact name in Task 3. `computeWinner` (Task 2) is imported and used with that exact name in Task 6. `findSimilarSubmissions` (Task 3) is imported and used with that exact name in Task 4. `Confetti`/`WinnerScreen`/`MyResults` component names and prop names match between their creation tasks (5/6/9) and their usage tasks (7/8/10).
