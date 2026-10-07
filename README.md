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
# optional: cp .env.example .env  (defaults point at the pilot project)
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

Two SQL suites impersonate anonymous and signed-in users against the real database and
always roll back. Paste each into the SQL editor and run it: the result message starts
with `ALL PASSED` or `FAILED`.

- `supabase/tests/foundation_security.sql` (20 checks): onboarding age matrix, no
  self-promotion to admin, no editing role/DOB/verification, users only see their own
  profile, admins see all, suspended admins lose access.
- `supabase/tests/jobs_eligibility.sql` (25 checks): every category × ages 12–18
  (63 combinations), customer's min-age request, 20:00/22:00 and 2 h/7 h working-time
  rules, `create_job()` validation, workers and other customers cannot read jobs or
  addresses, category ages are configuration.
- `supabase/tests/feed_and_applications.sql` (26 checks): feed only shows open, upcoming,
  approved, age-eligible jobs in the worker's municipality; no address/customer id/surname/DOB
  in worker functions; no applying twice, to ineligible or closed jobs; nobody can set an
  application to SELECTED; applications visible only to the worker, the job's customer and admins.

The Supabase security advisor lists every `security definer` function callable by signed-in
users. That is intentional: those functions *are* the API (`complete_onboarding`,
`create_job`, `get_job_feed`, `get_job_details`, `apply_to_job`, `withdraw_application`,
`get_my_applications`, `is_admin`), and each checks the caller's role itself.

## Data model (so far)

| Table | Purpose | Who can read / write |
| --- | --- | --- |
| `platform_settings` | Single row: worker age range (default 13–17), customer minimum age (18) | Signed-in users read. Team edits via SQL. |
| `municipalities` | Database-driven list (Reykjavík, Kópavogur, Hafnarfjörður, Garðabær, Mosfellsbær, Seltjarnarnes) | Public read |
| `profiles` | One row per user, `id = auth.users.id` | Own row only (admins: all). Created **only** via `complete_onboarding()`. Users can update only `first_name`, `last_name_private`, `municipality_id`, `avatar_id`, `bio`. |
| `job_categories` | 9 categories with min/max age, safety rules, risk, manual approval, and the legal basis for each | Signed-in users read. Team edits via SQL. |
| `jobs` | Public job fields, status, customer's min-age request | Customer reads own jobs; admins all. **No client writes** — created via `create_job()`; status changes via functions (stage 5). |
| `job_private_details` | Exact address / coordinates, separate from public fields | Job owner and admins only (assigned worker from stage 5). |
| `job_applications` | One per worker per job; PENDING → SELECTED / NOT_SELECTED / WITHDRAWN | Worker (own), the job's customer, admins. Written only via `apply_to_job()` / `withdraw_application()`. |

Age is **never stored** — it is computed from `date_of_birth`. Whether a worker may take a
job is decided only by `public.worker_can_take_job()` (age on the job date, category,
customer's request, time of day, length). Rules follow reglugerð 426/1999 and are all
configuration — see **[docs/AGE_RULES.md](docs/AGE_RULES.md)**, including the open legal
questions.

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
  tests/               SQL security suites
  seed/                local-only test data
docs/DEVELOPMENT_PLAN.md
docs/AGE_RULES.md      how reglugerð 426/1999 is applied
```

Code, database and comments are in English; everything users see is in Icelandic.

## Test accounts

The hosted project contains **no fake data**. For a local stack (`npx supabase start`) run
`supabase/seed/dev_seed.sql`: 2 test customers, workers aged 13–17, accounts aged 12 and
18 without profiles, and one job per category. All emails end in `@test.ungverk.invalid`
and all names start with “Próf”. The SQL test suites create and roll back their own users.

## Current status

**Stage 4 done (worker feed, job details, applications):**

- “Verk nálægt þér”: server-filtered feed with pull-to-refresh and paging
- Job details with safety rules, customer first name, no address; apply with an optional
  message; withdraw while pending
- “Umsóknir” shows the worker's applications and their status
- Customers see how many have applied on each job
- 26/26 SQL checks

**Stage 3 done (categories, jobs, age eligibility):**

- 9 job categories with ages based on reglugerð 426/1999; customers can ask for older workers
- “Posta verkefni” form: category rules, date/time/length chips, age preference, live
  “who can take this job” preview, private address, safety confirmation
- “Mín verkefni” lists the customer's real jobs with status
- 25/25 SQL eligibility checks, 28 unit tests

**Stage 1–2 done (foundation, auth, profiles, roles):**

- Expo app with ungVERK branding, navigation and theme
- Email one-time-code sign-in (no passwords stored by us)
- Role choice (“Ég þarf aðstoð” / “Ég vil vinna”) → onboarding → role-specific tabs
- Server-side role and age validation; admin cannot be self-assigned
- Suspended accounts are blocked
- 20/20 SQL security checks, 19 unit tests

**Not built yet** (screens say so honestly, no fake data): choosing a worker, assignment,
completion, reviews, reports, admin tools. See the plan.

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
- Legal questions (who is the employer, guardian information, insurance, tax, privacy)
  must be verified before public launch — see the open questions in docs/AGE_RULES.md.
- Working-time limits are checked per job, not yet summed per day/week across jobs.
- Jobs in “Annað” wait for admin approval, but the approval screen comes in stage 7.
