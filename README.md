# Job Tracker

A phone-first web app (installable PWA) for running small building jobs: each job's tasks and shopping list, an employee's hours and pay, and receipts split across jobs.

- **Jobs**: address (with map links), client contact, notes, and a colour. Jobs are archived rather than deleted.
- **Tasks and Shopping**: per job, plus tabs that gather them across every active job. A task can have its own shopping list.
- **Hours**: a timer and a ledger of hours worked and payments made, for one employee. Each entry keeps the rate it was logged at.
- **Expenses**: receipts from a photo (read by Gemini through Firebase AI Logic) or typed in. Their lines are tagged to jobs, and each job gets its share of the tax.

Built with React 19, TypeScript, Vite, TanStack Router and Tailwind, on Firebase (Auth, Firestore, Storage, App Check, AI Logic). It's online-only: there's no offline cache, and an overlay covers the app while there's no connection.

## Setup

Needs Node 22 and, for the emulators, Java 21.

```sh
npm ci
```

To run against the real project, put the `VITE_FIREBASE_*` keys (and optionally `VITE_RECAPTCHA_SITE_KEY`) in `.env.local`. The deploy workflow lists them all.

## Running it

| Command | What it does |
| --- | --- |
| `npm run dev:local` | Runs the app against local emulators with two seeded businesses. Sign in as `test@example.test` (Alder Builders) or `other@example.test` (Birch Co), password `local-test-only`. |
| `npm run dev` | Runs the app against the real Firebase project (needs `.env.local`). |
| `npm test` | Unit tests. |
| `npm run test:emulator` | Tests the security rules and services against the Firestore and Storage emulators. |
| `npm run lint` / `npm run typecheck` | Lint and type-check. |

The emulators use ports 9099 (Auth), 8088 (Firestore) and 9199 (Storage), set in `firebase.json`. On a Mac without Java on the PATH, set `JAVA21_HOME`.

## Businesses and access

Each business's data lives under `businesses/{id}` in Firestore, and its receipt photos under `businesses/{id}/receipts/` in Storage. The rules let an account in only if it's listed in that business's `members`. Every account belongs to exactly one business; anyone signed in without one sees a "No access" screen.

There's no sign-up: people are added with the admin script, which uses a service account key for the project.

```sh
export GOOGLE_APPLICATION_CREDENTIALS=~/keys/<project>-admin.json   # keep it outside the repo
node scripts/admin.ts --project <project-id> add-business "Alder Builders"   # prints the business ID
node scripts/admin.ts --project <project-id> add-member <businessId> pat@example.com
node scripts/admin.ts --project <project-id> remove-member <businessId> pat@example.com
node scripts/admin.ts --project <project-id> businesses | members <businessId>
```

`add-member` creates the login and prints a link for the person to set their password. "Forgot password?" on the sign-in screen sends the same kind of link.

To move the original single-owner data into a business (from the live project into the beta project), with a key for each project:

```sh
FROM_CREDENTIALS=~/keys/<live-project>-admin.json node scripts/admin.ts --project <beta-project> import-live <businessId> --from <live-project> --dry-run
```

`--dry-run` only counts what would be copied; leave it out to copy. It never changes the live project, and running it again updates rather than duplicates.

## Deploying

Every push runs CI (lint, typecheck, unit and emulator tests). A push to `main` or `beta` that passes deploys the app to Firebase Hosting, along with the Firestore and Storage rules and the indexes. There's no manual deploy step.

| Branch | Project | Secrets |
| --- | --- | --- |
| `main` | `job-tracker-9eef5` (live) | the repository's secrets |
| `beta` | `job-tracker-beta` | the `beta` GitHub Environment's secrets |

Each needs `FIREBASE_SERVICE_ACCOUNT`, the `VITE_FIREBASE_*` keys and `VITE_RECAPTCHA_SITE_KEY`. An environment falls back to the repository's secrets for any it's missing, so the deploy first checks that the service account and app config are for the branch's project, and stops if not.
