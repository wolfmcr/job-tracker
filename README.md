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
| `npm run dev:local` | Runs the app against local emulators with seed data. Sign in as `test@example.test` / `local-test-only`. |
| `npm run dev` | Runs the app against the real Firebase project (needs `.env.local`). |
| `npm test` | Unit tests. |
| `npm run test:emulator` | Tests the security rules and services against the Firestore and Storage emulators. |
| `npm run lint` / `npm run typecheck` | Lint and type-check. |

The emulators use ports 9099 (Auth), 8088 (Firestore) and 9199 (Storage), set in `firebase.json`. On a Mac without Java on the PATH, set `JAVA21_HOME`.

## Access

Only accounts listed in `firestore.rules` and `storage.rules` can use the app; keep the two lists the same. Anyone else who signs in sees a "No access" screen.

## Deploying

Every push runs CI (lint, typecheck, unit and emulator tests). A push to `main` that passes deploys the app to Firebase Hosting, along with the Firestore and Storage rules and the indexes. There's no manual deploy step.
