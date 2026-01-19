# Spec: Admin Tools (Ingestion & CRUD)

## 1. Blueprint (Design)

### Context
> **Goal:** Enable the `@Librarian` to feed data into the system.
> **Why:** We need a way to populate the database without manually writing SQL.
> **Architectural Impact:** Creates a set of executable scripts in `scripts/` or `apps/admin-cli`.

### Ingestion Interface (MVP)

#### The "Seed File" Strategy
Instead of a UI, we will use structured JSON files committed to the repo (or a private submodule) as the "Staging Area". Keys are slugs.

**File Structure: `data/products.json`**
```json
[
  {
    "slug": "myrrys",
    "title": "Myrrys",
    "year": 2023,
    "product_type": "Core Rulebook",
    "publisher": "otava",
    "creators": [
      { "slug": "mike-pohjola", "role": "Author" }
    ]
  }
]
```

#### The Ingestor Script
A Node.js script (`pnpm run ingest`) that:
1.  Reads the JSON files.
2.  Validates them against the Zod Schemas (`packages/database`).
3.  Upserts them to Supabase via `supabase-js` (using Service Role key).
4.  Reports success/failure per item.

### Validation Rules
*   **Referential Checks:** IF a "publisher" slug is provided, the script must check if it exists in `data/publishers.json` (or DB) before inserting the product.
*   **Idempotency:** Running the script twice should result in "No Changes" or "Update", never duplicates.

### Anti-Patterns
*   **No "Magic" Fixes:** If validation fails, the script dies or logs an error. It does NOT try to guess.
*   **No Direct SQL:** Use the Supabase JS client to ensure we pass through any RLS/Triggers (though Service Role bypasses RLS, it respects DB constraints).

---

## 2. Contract (Quality)

### Definition of Done
- [ ] `scripts/ingest.ts` exists and can parse a mock JSON file.
- [ ] Script successfully inserts a Publisher, Creator, and Product into local Supabase.
- [ ] Script updates an existing record if run again (Upsert).
- [ ] Script fails with a clear error if data is invalid (e.g., missing title).

### Scenarios (Gherkin)

**Scenario: Bulk Import**
- Given: A clean database
- And: A valid `publishers.json` with 10 items
- When: I run `pnpm run ingest:publishers`
- Then: 10 rows are added to the `publishers` table

**Scenario: Data correction**
- Given: A product "Myrryss" (typo) exists in DB
- When: I correct the JSON to "Myrrys" and run ingestion
- Then: The existing row is updated (title: "Myrrys")
- And: The ID remains the same
