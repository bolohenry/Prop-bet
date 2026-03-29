# Wedding Prop Bets

A simple web app where an admin creates a wedding event, shares an invite link with guests, and guests submit prop bet answers from their phones. The admin scores outcomes live during the wedding, and everyone sees realtime leaderboard updates.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS v4
- **Backend**: Express.js REST API + Server-Sent Events (SSE) for realtime
- **Database**: SQLite via better-sqlite3
- **No external services required** — runs as a single process in production

## Quick Start

```bash
npm install
npm run dev
```

This starts both the Express server (port 3001) and Vite dev server (port 5173).

## Production

```bash
npm run build
npm start
```

The Express server serves the built frontend and API on port 3001 (configurable via `PORT` env var).

## How It Works

1. **Admin creates an event** at `/admin/create` — gets an invite link and admin link
2. **Share the invite link** with guests (e.g. `yoursite.com/i/abc123`)
3. **Guests submit answers** on their phones via the survey form
4. **After submitting**, guests see their answers + live leaderboard + answer matrix
5. **Admin scores questions** live at the admin dashboard — everyone's dashboards update in realtime
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

## Design Decisions

- **SQLite** — zero setup, single-file database, perfect for small event apps
- **SSE over WebSockets** — simpler, sufficient for server-to-client updates
- **Session storage for participant gating** — lightweight, no accounts needed. Tradeoff: clearing browser data loses dashboard access (acceptable for a live event)
- **No auth framework** — admin access is via secret URL, participant access is via invite URL + name
- **Scoring recalculates on every outcome change** — simple and correct for small participant counts
