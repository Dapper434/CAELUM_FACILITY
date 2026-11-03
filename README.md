# CAELUM Facility

Hospital app for the CAELUM blood-transfer network. One app serves both sides of a transfer:
a facility is the **recipient** when it raises a request and the **donor** when it answers an offer.
All data goes through the shared CAELUM API (contract v1.2.0, `/api/v1`); sign-in uses Supabase Auth.

## Features

| Screen | Route | What it does |
|---|---|---|
| Sign in | `/login` | Supabase email/password sign-in; the API identifies the facility from `app_metadata`. |
| Overview | `/` | Counts of open alerts, suggested and open requests, offers to answer, active transfers. |
| Inventory | `/inventory` | Units sorted by expiry, filters, add units, mark available / expired / discarded. |
| Availability | `/availability` | Aggregated stock by facility in the region (or all regions in an emergency). |
| Forecast & alerts | `/forecast` | 7-day demand forecast, open shortage alerts, run the forecaster, confirm or dismiss suggested requests. |
| Requests | `/requests` | List and create requests with urgency. |
| Request detail | `/requests/:id` | Ranked candidate donors with ETAs (labelled "estimate" when routing fell back), send an offer, live offer countdown, cancel. |
| Donor offers | `/offers` | Incoming offers: hold / extend hold, accept, decline with reason, countdown to expiry. Outgoing offers for reference. |
| Transfers | `/transfers` | Active or all transfers where the facility is a party. |
| Transfer detail | `/transfers/:id` | Stage timeline, Leaflet + OpenStreetMap tracking (courier position, route, ETA), temperature readings with excursions, custody panel, custody events and audit trail. |
| Settings | `/settings` | Facility contact name, phone and address (`PATCH /facilities/{id}`, audited). |
| Audit trail | `/audit` | Hash-chained audit entries for all of this facility's transfers. |

Custody panel:
- **Donor:** pack & seal (scan unit codes, seal number, cooler, temperature) before the pack deadline, show the signed pickup QR and seal number, assign an available courier and watch the courier-accept deadline.
- **Recipient:** show the 6-digit drop-off code for the courier, check the seal number on the cooler, confirm receipt and condition.

SMS notifications are on hold and not part of this app.

## Setup

Requirements: Node 18+ and the CAELUM API running (see the API repo: `python main.py`, port 5000).

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev            # http://localhost:5173
```

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | API origin, e.g. `https://caelum-api.onrender.com`; `/api/v1` is appended if missing (a value already ending in `/api/v1` is used as is) |
| `VITE_SUPABASE_URL` | Supabase project URL (same project as the admin console) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (`sb_publishable_…`); the old `VITE_SUPABASE_ANON_KEY` name is still read as a fallback |

The API must list the app origin in `CORS_ORIGINS` (5173 is in the default list).
Users need `app_metadata.role = "facility"` and a `facility_id`.

If `VITE_API_BASE_URL` is missing the app shows a configuration error screen; only `npm run dev` falls back to `http://localhost:5000/api/v1`. Missing Supabase values also show that screen.
An expired or invalid token (API `401`) signs the user out and returns to `/login`.

Scripts: `npm run dev`, `npm run build`, `npm run preview`, `npm test` (Vitest).

## Architecture

```
src/
  api/         one client per API resource (me, facilities, inventory, availability,
               forecast, requests, offers, transfers, couriers)
  components/  reusable UI: layout, badges, countdown, map, timeline, custody panels, audit trail
  pages/       one component per route
  hooks/       useAsync (load + poll), useAction (mutations), useCountdown
  context/     AuthContext: Supabase session + /me profile
  lib/         config, Supabase client, HTTP client for the {data}/{error} envelope
  utils/       constants, formatting (Africa/Nairobi), geo, temperature bands, custody checks
  test/        Vitest setup
```

- **HTTP:** `lib/http.js` adds `Authorization: Bearer <access_token>` from the Supabase session, unwraps `data`, and throws `ApiError` with the contract's `code`, `message` and `details`.
- **Live data:** pages poll (offers 15 s, tracking 10 s while in transit). Timeouts are computed client-side from `expires_at`, `pack_deadline` and `courier_accept_deadline`; the server enforces them.
- **Roles:** on a transfer the app compares `donor_facility_id` with the signed-in facility to show the donor or recipient panel.
- **Styling:** Tailwind with the admin console palette (warm canvas, cobalt, burgundy) and Plus Jakarta Sans.

## Signing in

Sign-in uses Supabase email and password (`signInWithPassword`); the app sends the Supabase access token as `Authorization: Bearer …` to the API. The old `/auth/demo-login` path is gone. Demo facility accounts are `donor@caelum.demo` and `recipient@caelum.demo`; ask the API owner for their passwords (never commit them).

## Deploy (Vercel)

1. Import the repo in Vercel; framework preset **Vite** (build `npm run build`, output `dist`).
2. Set the environment variables for Production (and Preview):
   - `VITE_API_BASE_URL` = `https://caelum-api.onrender.com` (required; `/api/v1` is added automatically)
   - `VITE_SUPABASE_URL` = `https://qvqkxuaslayxvjgamtil.supabase.co`, `VITE_SUPABASE_PUBLISHABLE_KEY` = the project's publishable key
3. `vercel.json` rewrites all paths to `index.html` so deep links like `/transfers/:id` work.
4. Add the Vercel domain to the API's `CORS_ORIGINS`.

`VITE_*` values are baked into the bundle at build time, so redeploy after changing them. Only the publishable key belongs here, never a service-role key.
