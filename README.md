# ungVERK

**Ungt fólk. Alvöru verkefni.**

ungVERK is a hyper-local marketplace in Iceland that connects adults who need simple
tasks done (lawn mowing, snow clearing, dog walking…) with young people aged 13–17
who want real, age-appropriate work.

Core loop: **POST → APPLY → SELECT → COMPLETE → CONFIRM → REVIEW**
First goal: **10 real jobs completed through ungVERK.**

> Status: closed-beta MVP in development. See [Current status](#current-status).

---

## Tech stack

| Layer | Choice |
| --- | --- |
| App | React Native · Expo SDK 57 · Expo Router · strict TypeScript |
| Backend | Supabase — Postgres, Auth (email one-time code), Row Level Security |
| Tests | Jest (business logic) · SQL security suite run against the real database |

The phone app is only the interface. **The source of truth is Supabase:** roles, ages,
permissions and state transitions are enforced by Postgres (RLS, column grants,
`security definer` functions and constraints), never by React components.

## Getting started

```bash
git clone <repo>
cd ungverk
npm install
cp .env.example .env      # then fill in the two values (see below)
npx expo start            # scan the QR code with Expo Go
```

Useful scripts:

```bash
npm run check      # typecheck + lint + unit tests
npm run typecheck
npm run lint
npm test
```

## Environment variables

| Variable | What it is |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Project URL, e.g. `https://llmwqlxtgilpvgiqskth.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The **publishable** key (`sb_publishable_…`) |

Both are designed to be public. **Never** put the `service_role` / secret key in the app
or in any `EXPO_PUBLIC_` variable — everything with that prefix is shipped to phones.
`.env` is git-ignored; only `.env.example` is committed.

## Supabase setup

Project: **ungVERK** (`llmwqlxtgilpvgiqskth`, region eu-west-1).

### Migrations

All schema changes live in `supabase/migrations/` and are applied in order. Never edit
the database by hand in the dashboard without adding a migration.

```bash
npx supabase link --project-ref llmwqlxtgilpvgiqskth
npx supabase db push
```

Regenerate TypeScript types after any schema change:

```bash
npx supabase gen types typescript --project-id llmwqlxtgilpvgiqskth > src/types/database.ts
```

### Required dashboard settings (one-time)

1. **Email template must contain the code.** Authentication → Emails → Templates:
   in both **Magic Link** and **Confirm signup**, include `{{ .Token }}`, e.g.
   `<p>Innskráningarkóðinn þinn er: <strong>{{ .Token }}</strong></p>`.
   Without this, users receive a link but the app asks for a code.
2. **Custom SMTP before real users.** Supabase's built-in email sender is heavily
   rate-limited and intended for testing only. Configure SMTP (Authentication → SMTP)
   before the pilot.

### Making someone an admin

Admin can never be self-selected in the app. A team member promotes an existing profile:

```sql
update public.profiles set role = 'ADMIN' where id = '<user uuid>';
```

### Security tests

`supabase/tests/foundation_security.sql` impersonates anonymous and signed-in users and
checks the rules (age matrix, no self-promotion, no editing role/DOB/verification, users
only see their own row, admins see all, suspended admins lose access). It always rolls
back. Paste it into the SQL editor and run it: the result message starts with
`ALL PASSED` or `FAILED`.

## Data model (so far)

| Table | Purpose | Who can read / write |
| --- | --- | --- |
| `platform_settings` | Single row: worker age range (default 13–17), customer minimum age (18) | Signed-in users read. Team edits via SQL. |
| `municipalities` | Database-driven list (Reykjavík, Kópavogur, Hafnarfjörður, Garðabær, Mosfellsbær, Seltjarnarnes) | Public read |
| `profiles` | One row per user, `id = auth.users.id` | Own row only (admins: all). Created **only** via `complete_onboarding()`. Users can update only `first_name`, `last_name_private`, `municipality_id`, `avatar_id`, `bio`. |

Age is **never stored** — it is computed from `date_of_birth` by `public.age_in_years()`
(Iceland time). Age limits are configuration, **not** legal claims: they must be verified
against Icelandic rules before public launch.

## Project structure

```
src/
  app/                 Expo Router screens
    (auth)/            welcome + email-code sign-in
    onboarding.tsx     role, first name, date of birth, municipality
    worker/            worker tabs: Heim · Verk · Umsóknir · Prófíll
    customer/          customer tabs: Heim · Mín verk · Posta · Prófíll
    admin/             admin area (stage 7)
  components/ui/       Button, Input, Screen, ChoiceChip, states, Wordmark
  components/profiles/ Avatar, MyProfile
  lib/                 supabase client, auth provider, profile API, error messages
  theme/               colors, typography, spacing — no raw colors in components
  types/database.ts    generated from Supabase
  utils/               age + validation (with unit tests)
supabase/
  migrations/          schema, RLS, functions
  tests/               SQL security suite
docs/DEVELOPMENT_PLAN.md
```

Code, database and comments are in English; everything users see is in Icelandic.

## Test accounts

None yet. Development seed data (customers and workers aged 12–18, test jobs per
category) arrives in stage 3 together with jobs, and will be clearly marked as test
data. The SQL security suite creates its own temporary users and rolls them back.

## Current status

**Stage 1–2 done (foundation, auth, profiles, roles):**

- Expo app with ungVERK branding, navigation and theme
- Email one-time-code sign-in (no passwords stored by us)
- Role choice (“Ég þarf aðstoð” / “Ég vil vinna”) → onboarding → role-specific tabs
- Server-side role and age validation; admin cannot be self-assigned
- Suspended accounts are blocked
- 20/20 SQL security checks, 19 unit tests

**Not built yet** (screens say so honestly, no fake data): jobs, feed, applications,
assignment, completion, reviews, reports, admin tools. See the plan.

## Known limitations

- Email templates need `{{ .Token }}` added in the dashboard (see above).
- Built-in Supabase email is rate-limited; custom SMTP needed before the pilot.
- Sessions are stored in AsyncStorage (Supabase's standard React Native setup). Encrypting
  the stored session is a candidate hardening step before public launch.
- Avatars are initials on a colored circle; illustrated avatars are a design task.
- Tabs are text-only (no icon library yet).
- Payments are not in the app. Nothing in the app claims payment processing, escrow or payouts.
- Identity/guardian verification is not implemented; `verification_status` stays
  `UNVERIFIED` and the “Staðfest” badge only appears when it is truly `VERIFIED`.
- Legal questions (labour rules for minors, guardian consent, privacy, insurance, tax)
  must be verified separately before public launch.
