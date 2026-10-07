# ungVERK — development plan

Goal of the MVP: the full loop works on real Supabase data —
a real adult posts a job, an eligible young person applies, gets selected,
completes it, the adult confirms and reviews, and the worker's profile shows
`1 klárað verk · ⭐ 5,0`.

Every stage ends with: typecheck + lint + unit tests + SQL security suite +
Supabase security advisor, and a short report.

| # | Stage | Contents | Status |
| --- | --- | --- | --- |
| 1 | Foundation | Expo SDK 57, Expo Router, strict TS, theme, env, Supabase client | ✅ |
| 2 | Auth + profiles + roles | Email OTP, `profiles`, `complete_onboarding()`, RLS, column grants, age bounds in `platform_settings`, municipalities | ✅ |
| 3 | Jobs + eligibility | `job_categories` (min/max age, risk, manual approval, active), `jobs` with private address columns split from public fields, status enum, create-job form, seed data (workers 12–18, jobs per category), age test matrix | next |
| 4 | Feed + details + apply | Server-side feed function (open, municipality, age-eligible, unassigned; no private fields), job details, `job_applications` (unique per worker/job, only open + eligible jobs) | |
| 5 | Assignment + state machine | Atomic `select_worker()` (row lock; selected/not-selected applications), transition functions — no client status writes; address revealed to assigned worker only | |
| 6 | Completion + reviews | start / worker-complete / customer-confirm, `reviews` (one per completed job, customer → worker), real completed-job count and rating on profiles | |
| 7 | Reports + admin + hardening | `reports`, admin screens (jobs, users, reports, suspend, cancel), event log for pilot analytics, full security test pass | |
| 8 | Polish | Empty/loading/error states, offline messaging, accessibility pass, avatars | |
| 9 | End-to-end | Run the definition-of-done scenario on real data | |

## Decisions that need the founding team (not code decisions)

These affect legal compliance, safety or privacy, so they are asked rather than invented:

1. **Category age rules for the pilot** — which categories are open to which ages.
   Stored as data in `job_categories`, so they can change without code changes.
2. **When the exact address is revealed** — proposal: only to the selected worker,
   only after assignment.
3. **Guardian involvement for workers** — whether a guardian must confirm before a
   minor can apply, and how.
4. **What customers see about applicants** — proposal: first name, age, municipality,
   avatar, completed jobs, rating, reviews. Never DOB, email, phone, school.
5. **Chat in V1 or not** — recommendation: not in the first pilot; contact happens
   after assignment through a channel the team chooses.
