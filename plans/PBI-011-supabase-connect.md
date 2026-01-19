# PBI-011: Supabase Initialization & Connection

> **Spec Reference:** `specs/database/spec.md`  
> **Persona:** @Architect

---

## 1. The Directive

Initialize a new Supabase project for `roolipeli-info` and connect it to the monorepo.

**In Scope:**
- Create Supabase project (Free Tier).
- Install `supabase` CLI in the project (devDependency).
- Configure `.env` files for local development (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
- Initialize `supabase/` directory in repo (`supabase init`).
- Verify local development workflow (`supabase start`).

**Out of Scope:**
- Creating tables (PBI-012).
- Production deployment rules.

---

## 2. Context Pointers

- **Architecture:** We are using Supabase as the managed Postgres provider.
- **Local First:** Focus on getting `supabase start` working so devs can work offline.

---

## 3. Verification Pointers

- **Success:** `pnpm supabase start` spins up a local Postgres instance.
- **Success:** `pnpm supabase status` returns valid URLs.
- **Governance:** `packages/database` should have its `package.json` scripts updated to include helpers (if needed).

---

## 4. Task Checklist

- [ ] Run `pnpm add -w -D supabase` (install CLI at root).
- [ ] Run `npx supabase init`.
- [ ] Add `.env.example` with Supabase placeholders.
- [ ] Update `package.json` scripts:
    - `"db:start": "supabase start"`
    - `"db:stop": "supabase stop"`
- [ ] Document the setup process in `docs/setup.md` (or update README).
