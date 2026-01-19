# PBI-013: The Ingestion Engine (CRUD v1)

> **Spec Reference:** `specs/admin-tools/spec.md`  
> **Persona:** @Librarian / @Dev

---

## 1. The Directive

Build the "Ingestion Engine" — a script-based workflow to populate the database from JSON seed files. This serves as our MVP "Admin Interface".

**In Scope:**
- Create `data/{publishers,creators,products}.json` sample files.
- Create `scripts/ingest.ts`.
- Implementation of the Upsert logic using `supabase-js` Admin Client.

**Out of Scope:**
- Web UI for editing.
- complex conflict resolution (just overwrite).

---

## 2. Context Pointers

- **Spec:** `specs/admin-tools/spec.md`.
- **Validation:** MUST maintain referential integrity. If a publisher is defined, it must exist. The script should run in order: Publishers -> Creators -> Products.

---

## 3. Verification Pointers

- **Success:** Running `pnpm ingest` reads from `data/*.json` and populates the local Supabase DB.
- **Success:** Running it a second time does not duplicate data.
- **Fail:** Invalid JSON (schema violation) should halt the script.

---

## 4. Task Checklist

- [ ] Create `data/publishers.json` with 1-2 real Finnish publishers (e.g., "Otava", "Myrrys").
- [ ] Create `scripts/ingest.ts`.
- [ ] Use `tsx` or `ts-node` to execute it.
- [ ] Implement `ingestPublishers()` function.
- [ ] Implement `ingestCreators()` function.
- [ ] Implement `ingestProducts()` function.
- [ ] Add `pnpm ingest` command to root `package.json`.
