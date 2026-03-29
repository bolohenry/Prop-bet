# Wedding Prop Bets

A simple web app where an admin creates a wedding event, shares an invite link with guests, and guests submit prop bet answers from their phones. The admin scores outcomes live during the wedding, and everyone sees realtime leaderboard updates.

## Stack

- **Frontend**: React + Vite + Tailwind CSS v4
- **Database + Realtime**: Supabase (Postgres + Realtime subscriptions)
- **Hosting**: Vercel (static site)
- **No custom backend** — the React app talks directly to Supabase

---

## Setup Guide (15 minutes)

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up / sign in
2. Click **New Project**, pick a name and password, choose a region
3. Wait for the project to finish provisioning (~1 minute)

### 2. Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open `supabase-schema.sql` from this repo, copy its entire contents, paste it in
4. Click **Run** — you should see "Success. No rows returned"

### 3. Enable Realtime

The schema SQL already runs `alter publication supabase_realtime add table ...` which enables Realtime. Verify it's on:

1. Go to **Database → Replication** in the Supabase dashboard
2. Under "supabase_realtime" you should see `events`, `submissions`, and `outcomes` listed

### 4. Get Your Supabase Keys

1. Go to **Settings → API** in the Supabase dashboard
2. Copy the **Project URL** (e.g. `https://abcdefg.supabase.co`)
3. Copy the **anon / public** key

### 5. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Import this repository (`Prop-bet`)
4. In the **Environment Variables** section, add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Deploy**
6. Done — you'll get a URL like `https://prop-bet-xxx.vercel.app`

### 6. (Optional) Local Development

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key
npm install
npm run dev
```

---

## How It Works

1. **Admin creates an event** at `/admin/create` — gets an invite link and admin link
2. **Share the invite link** with guests (e.g. `yoursite.vercel.app/i/abc123`)
3. **Guests submit answers** on their phones via the survey form
4. **After submitting**, guests see their answers + live leaderboard + answer matrix
5. **Admin scores questions** live at the admin dashboard — dashboards update in realtime via Supabase Realtime
6. **Admin exports CSV** when done

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Home page |
| `/admin/create` | Create a new wedding event |
| `/admin/:adminCode` | Admin dashboard (scoring, status, export) |
| `/i/:inviteCode` | Participant join page |
| `/i/:inviteCode/survey` | Prop bet survey form |
| `/i/:inviteCode/dashboard` | Post-submit live dashboard |
