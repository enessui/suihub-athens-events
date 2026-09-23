# SuiHub Athens — Events & Coworking Calendar

The web app for [SuiHub Athens](https://www.sui.io): a public events calendar, free coworking check-in and registration, meeting-room booking, a photo gallery, and an invite-only admin dashboard. Built with Next.js and Supabase, deployed on Vercel.

All event and space times are shown in a single fixed timezone, **Europe/Athens**, so the calendar reads the same for every visitor.

---

## Features

- **Events calendar** — public listing of events, with categories, cover images, and registration links. Admins can create/edit events or import them from a Luma or Meetup link.
- **Coworking check-in** — visitors check in on arrival; a live count and a builder leaderboard (first names only) are shown.
- **Free coworking registration** — one-time signup with optional newsletter opt-in.
- **Meeting-room booking** — request the private meeting room on any weekday, for a chosen length of time; an admin approves each request (they're emailed when one comes in).
- **Event requests** — the public can request to host an event.
- **Gallery** — curated photos, with a public "submit your photos" flow (emailed to the team for review).
- **Newsletter** — email signup.
- **Admin dashboard** — event management, analytics, attendance, and inline editing of the About, Coworking, and Guidelines pages plus the announcement banner.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components, Server Actions) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS v4, shadcn/ui on Base UI |
| Backend | Supabase — Postgres, Auth, Storage |
| Email | Resend |
| Bot protection | Cloudflare Turnstile |
| Hosting | Vercel (auto-deploy on push to `main`) |

There is **no separate backend service** — the browser talks to React Server Components, mutations run through Server Actions, and those talk directly to Supabase.

---

## Getting started

### Prerequisites
- Node.js 20+
- A Supabase project (Postgres + Auth + Storage)
- pnpm (the project installs with pnpm on Vercel; npm works locally too)

### Install & run

```bash
pnpm install
pnpm dev
```

The app runs at `http://localhost:3000`.

### Other scripts

```bash
pnpm build    # production build
pnpm start    # run the production build
pnpm lint     # eslint
```

---

## Environment variables

Create a `.env.local` in the project root (it is gitignored — never commit it). On Vercel, set the same variables under **Settings → Environment Variables** for Production, Preview, and Development.

### Required — the app won't run without these
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key (safe for the browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key — **server-only secret**, bypasses RLS |

> `NEXT_PUBLIC_*` values are baked into the build, so they must exist **before** the build runs. If you add them after a failed deploy, trigger a fresh redeploy.

### Optional — features degrade gracefully if unset
| Variable | Description | If missing |
|---|---|---|
| `RESEND_API_KEY` | Sends admin notification emails | No emails are sent |
| `ADMIN_NOTIFY_EMAIL` | Recipient(s) for admin notifications, incl. meeting room requests. Comma-separate several | Falls back to `suihubathens@sui.io` |
| `RESEND_FROM` | Sender address on a domain verified in Resend, e.g. `SuiHub Athens <hello@yourdomain>`. Needed to email coworkers when their meeting room request is approved or declined | Resend's shared test sender, which can only deliver to the Resend account's own address |
| `GOOGLE_SHEETS_WEBHOOK_URL` | Mirrors signups to a Google Sheet | Skipped |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key | Captcha widget not shown |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret | **Captcha fails open** — bot protection is disabled |

For local testing, Cloudflare publishes always-pass test keys (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`).

---

## Admin access

The admin dashboard is **invite-only**.

- Sign in at `/auth/login`; the dashboard lives at `/admin`.
- Access is gated by an `admin_allowlist` table plus the `is_admin` database function. A signed-in user who isn't on the allowlist is redirected away.
- New admins are added via the invite flow (first signup bootstraps when the allowlist is empty).

---

## Security & privacy model

- **Personal data is admin-only.** Booker/check-in/registration emails are never exposed to the public. The tables holding them (`coworking_members`, `coworking_checkins`, `newsletter_subscribers`, `meeting_room_bookings`) have Row-Level Security enabled and deny the public anon role; the server reads them through the service-role client. For non-admins, names/emails are stripped server-side before any data reaches the browser, so they never appear in the page payload.
- **Row-Level Security is load-bearing.** The anon key ships in the browser by design, so RLS is what protects the data. Keep PII tables locked (RLS on, no public policies) and only expose genuinely public content (`events`, `gallery_images`, `site_settings`) for public read. `event_requests` allows public INSERT but not SELECT.
- **Bot protection.** Public write endpoints (check-in, registration, event request, newsletter, gallery submission, meeting-room booking) require a Cloudflare Turnstile token, verified server-side.
- **Security headers.** A Content-Security-Policy and standard hardening headers (HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`) are set in `next.config.mjs`.
- **Secrets.** The service-role key is server-only and never shipped to the client. `.env.local` is gitignored.

---

## Editable content

The About, Coworking, and Guidelines pages and the announcement banner are **admin-editable** and stored in the `site_settings` table. The values in `lib/about.ts`, `lib/coworking.ts`, and `lib/guidelines.ts` are only **defaults** — once an admin edits a page, the database copy takes over. To change live copy that has been edited, use the in-page admin editors, not the code defaults.

---

## Deployment

The repository is connected to Vercel and deploys automatically:

```bash
git add -A && git commit -m "your message"
git push          # push to main → Vercel builds and deploys to production
```

Pushing to any other branch or opening a pull request creates a **preview deployment** at its own URL. Merging into `main` promotes to production.

For a one-off manual deploy: `npx vercel --prod` (uses the environment variables set in the Vercel dashboard, not your local `.env.local`).

---

## Project structure

```
app/                    App Router routes + Server Actions (co-located actions.ts)
  admin/                Admin dashboard, analytics, event actions, Luma/Meetup import
  auth/                 Login / invite-only signup
  checkin/ coworking/   Check-in, registration, meeting-room, reserve flows
  events/ gallery/ …    Public pages
components/             UI components (calendar, admin, coworking, gallery, ui/)
lib/                    Content defaults, Supabase clients, Turnstile, notify, events helpers
```
