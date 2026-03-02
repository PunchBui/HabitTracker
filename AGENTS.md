# Agents

## Cursor Cloud specific instructions

### Overview

This is a **Habit Tracker** — a React SPA (Vite + TypeScript + Tailwind CSS 4) that talks to a hosted **Supabase** backend. There is no custom server; the frontend calls Supabase directly via `@supabase/supabase-js`.

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Vite dev server | `yarn dev` | 5173 | Add `--host 0.0.0.0` when testing in cloud VMs |

The Supabase backend is a hosted cloud instance. Credentials live in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). The DB schema is in `supabase/schema.sql`.

### Key commands

See `package.json` scripts: `yarn dev`, `yarn build`, `yarn lint`, `yarn preview`.

### Non-obvious notes

- The `.env` file must exist with valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values. The app will crash at startup if either is missing (see `src/lib/supabase.ts`).
- There are **no automated tests** in this codebase currently. `yarn lint` is the primary code-quality check.
- RLS policies allow anonymous access for development (see `supabase/schema.sql`).
- The user prefers `yarn` as the package manager (per user rules).
