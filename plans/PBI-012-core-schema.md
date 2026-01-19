# PBI-012: Core Schema Implementation

> **Spec Reference:** `specs/database/spec.md`  
> **Persona:** @Architect

---

## 1. The Directive

Implement the core database schema for `publishers`, `creators`, and `products` using Supabase migrations, and generate the corresponding TypeScript types and Zod schemas.

**In Scope:**
- SQL Migration parsing the requirements in `specs/database/spec.md`.
- RLS Policies for the tables.
- `supabase gen types` execution.
- Zod schema creation in `packages/database`.

**Out of Scope:**
- Data population (PBI-013).
- UI Components.

---

## 2. Context Pointers

- **Spec:** Follow `specs/database/spec.md` exactly for column names and types.
- **Naming:** Tables are `snake_case` plural (e.g., `products`). Zod schemas are `PascalCase` singular (e.g., `ProductSchema`).
- **Type Safety:** Ensure the Zod schemas use `.describe()` or specific validation to match the DB constraints (e.g., `z.string().max(255)`).

---

## 3. Verification Pointers

- **Success:** `supabase db reset` runs without errors.
- **Success:** `packages/database/src/types/supabase.ts` contains `Row` definitions for all 3 tables.
- **Success:** `packages/database/index.ts` exports `ProductSchema`, `PublisherSchema`, `CreatorSchema`.
- **Test:** A basic unit test in `packages/database` that validates a mock object against `ProductSchema`.

---

## 4. Task Checklist

- [ ] Create migration: `supabase db diff -f init_core_schema` (or manually create named migration file).
- [ ] Write SQL for `publishers`, `creators`, `products`, `products_creators`.
- [ ] Add RLS Policies:
    - Enable RLS on all tables.
    - Policy "Enable read for everyone": `USING (true)`.
    - Policy "Enable all for restricted": `USING (false)` (or admin logic, for now just lock it down or allow service_role).
- [ ] Run `supabase db reset` to apply.
- [ ] Run `supabase gen types --lang=typescript --local > packages/database/src/types/supabase.ts`.
- [ ] Create `packages/database/src/schemas/product.ts` (and others).
- [ ] Export everything from `packages/database/src/index.ts`.
