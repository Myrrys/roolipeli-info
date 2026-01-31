# Spec: Database Schema (Core Entities)

## 1. Blueprint (Design)

### Context
> **Goal:** Establish the canonical data model for Finnish RPGs.
> **Why:** The application needs a persistent, relational source of truth for games, publishers, and creators.
> **Architectural Impact:** This defines the `packages/database` exports and the Supabase SQL structure.

### Architectural Pattern
- **Library Purity**: `packages/database` MUST NOT fetch environment variables or initialize a global Supabase client.
- **Dependency Injection**: All query functions MUST accept an initialized `SupabaseClient` as their first argument.
- **Type Safety**: The library MUST export a `DatabaseClient` type helper for consumers.

### Data Architecture

#### Core Tables
1.  **`publishers`**: Entities that release products.
    *   `id` (uuid, pk)
    *   `name` (text, unique)
    *   `slug` (text, unique, for urls)
    *   `description` (text, md)
2.  **`creators`**: Individuals who make products.
    *   `id` (uuid, pk)
    *   `name` (text, unique)
    *   `slug` (text, unique)
3.  **`products`**: The RPG items (Games, Supplements, Zines, etc.).
    *   `id` (uuid, pk)
    *   `title` (text)
    *   `slug` (text, unique)
    *   `publisher_id` (fk -> publishers, optional)
    *   `product_type` (enum: 'Core Rulebook', 'Adventure', 'Supplement', 'Zine', 'Quickstart', 'Other')
    *   `year` (int)
    *   `isbn` (text, optional) **[DEPRECATED]** - Use `product_isbns` table instead for multiple ISBNs
    *   `description` (text, md)
    *   `lang` (enum: fi, sv, en)
4.  **`product_isbns`**: Multiple ISBNs per product (e.g., Hardcover, PDF).
    *   `id` (uuid, pk)
    *   `product_id` (fk -> products)
    *   `isbn` (text, not null)
    *   `label` (text, optional) - e.g., 'Kovakantinen', 'PDF'
    *   `created_at` (timestamp)
5.  **`products_creators`**: Join table.
    *   `product_id` (fk)
    *   `creator_id` (fk)
    *   `role` (text: 'Author', 'Illustrator', etc.)

#### Validation Rules
*   **Slug Integrity:** Slugs must be kebab-case and unique per table.
*   **Referential Integrity:** Products CAN exist without a Publisher (e.g., self-published or unknown).
*   **Zod Parity:** Every table MUST have a corresponding Zod schema in `packages/database`.

### Anti-Patterns
*   **No Soft Deletes:** For MVP, strict hard deletes are fine.
*   **No "User" Data Mixed In:** Keep content (Product Catalog) separate from User data.

---

## 2. Contract (Quality)

### Definition of Done
- [ ] SQL Migrations created and applied.
- [ ] `supabase gen types` output saved to `packages/database/src/types/supabase.ts`.
- [ ] Zod schemas exported from `packages/database/src/schemas/`.
- [ ] RLS Policies:
    - `SELECT`: Public (anon key)
    - `INSERT/UPDATE/DELETE`: Service Role / Admin Only

### Regression Guardrails
- **Slug Immutability:** Changing a slug breaks SEO. Need a redirect strategy if changed (out of scope for v1, but good to note).
- **Zod/SQL Drift:** Zod schemas must explicitly use `z.string().max(X)` matching DB constraints.

### Scenarios (Gherkin)

**Scenario: Enforced Relationships**
- Given: A Publisher "Otava" exists
- When: I try to insert a Game "My Game" with `publisher_id` referencing "Otava"
- Then: The insertion succeeds

**Scenario: Orphan Prevention**
- Given: A Publisher "Otava" exists with 1 Game
- When: I try to delete "Otava"
- Then: The deletion fails (Foreign Key constraint violation) OR cascades (if we decide to cascade, but default should be restrict)
