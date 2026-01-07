# Wedding Prop Bets (MVP)

A simple Cloudflare Pages + Workers + D1 app to collect wedding prop bets and tally results.

## Database Schema (Proposed + Implemented)

**Tables**
- `weddings`
  - `id` (PK)
  - `name` (text)
  - `date` (text)
  - `invite_code` (short code, unique)
  - `admin_token` (long random, unique)
  - `submissions_open` (boolean)
  - `winner_submission_id` (FK to submissions)
  - `created_at_utc`, `updated_at_utc`
- `submissions`
  - `id` (PK)
  - `wedding_id` (FK)
  - `display_name`
  - `submitted_at_utc`
  - `q1`..`q13` answers (all required)
  - unique constraint on `(wedding_id, display_name)` to enforce one submission per name
- `answer_keys`
  - `wedding_id` (PK, FK)
  - `q3`..`q12` answers
- `admin_events` (optional log)

The schema is defined in `worker/migrations/0001_init.sql`.

## File Tree (Scaffold)

```
/worker
  /src
    index.js
  /migrations
    0001_init.sql
  wrangler.toml
/pages
  index.html
  survey.html
  confirmation.html
  admin.html
  admin_dashboard.html
  shared.js
  styles.css
/scripts
  seed.sql
README.md
```

## Definition of Done (Checklist)

- [x] Participant join, survey, and confirmation pages.
- [x] Admin create wedding, toggle submissions, answer key, leaderboard, tie-break selection, CSV export.
- [x] One submission per display name per wedding.
- [x] Submissions stored in UTC ISO 8601.
- [x] Tie breaker stored/displayed as free text.
- [x] Admin recovery endpoint secured by `ADMIN_RECOVERY_SECRET`.
- [x] Wrangler commands documented.

## Deploy in 30 Minutes (No Credit Card)

### 1) Create accounts
- Create a Cloudflare account: https://dash.cloudflare.com
- Create a GitHub account if you don't have one: https://github.com

### 2) Install Wrangler
```bash
npm install -g wrangler
```

### 3) Create a D1 database
```bash
wrangler --config worker/wrangler.toml d1 create wedding-prop-bets
```
Copy the `database_id` from the output and paste it into `worker/wrangler.toml`.

### 4) Apply migrations
```bash
wrangler --config worker/wrangler.toml d1 migrations apply wedding-prop-bets --local
wrangler --config worker/wrangler.toml d1 migrations apply wedding-prop-bets
```

### 5) (Optional) Seed a sample wedding
```bash
wrangler --config worker/wrangler.toml d1 execute wedding-prop-bets --file=./scripts/seed.sql
```

### 6) Set Worker secrets
```bash
wrangler --config worker/wrangler.toml secret put ADMIN_RECOVERY_SECRET
```

### 7) Deploy the Worker API
```bash
wrangler --config worker/wrangler.toml deploy
```
Note the worker URL (for example, `https://wedding-prop-bets.yourname.workers.dev`).

### 8) Deploy the Pages frontend
1. Push this repo to GitHub.
2. Go to Cloudflare Pages > Create a project > Connect to GitHub.
3. Set **Build command** to **(empty)**.
4. Set **Build output directory** to **/pages**.
5. Deploy.

### 9) Connect the frontend to the API
Open your Pages site and set the **API Base URL** to your Worker URL.

### 10) Verify end-to-end
Create a wedding in Admin Home, then submit a participant response, then score and export CSV.

## Admin Recovery (Lost admin link)
Use this Worker endpoint to rotate the admin token:
- `POST /api/admin/recover`
- Header: `X-Admin-Recovery-Secret: <your secret>`
- Body: `{ "invite_code": "INV123" }`

The response includes a new `admin_token` that you can use to rebuild the admin URL.

## Required Environment Variables
- `ADMIN_RECOVERY_SECRET` (Worker secret)

## Notes
- All timestamps are stored in UTC ISO 8601.
- The tie breaker is stored and displayed exactly as typed.
