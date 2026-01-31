# Spec: Product References (Canonical Sources)

## 1. Blueprint (Design)

### Context
> **Goal:** Establish a "Canonical Source of Truth" for products by linking to official external sources (Wikidata, Official Sites) and bibliographic references (Reviews, Articles).
> **Why:** Empower users to find authoritative information and provide a scholarly/bibliographic layer to the database.
> **Architectural Impact:** Adds a new table `product_references` separate from valid product metadata.

### Data Architecture

#### Table: `product_references`
Stores external links with semantic typing.

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `product_id` | `uuid` | - | FK -> `products.id` (Delete Cascade) |
| `reference_type` | `text` | - | Enum-like: `official`, `source`, `review` |
| `label` | `text` | - | Display label (e.g. "Wikidata", "Review by X") |
| `url` | `text` | - | The external link |
| `citation_details` | `jsonb` | `null` | Structured bibliographic data (optional) |
| `created_at` | `timestamptz` | `now()` | - |

#### JSONB: `citation_details`
Used for rich rendering of reviews and articles (APA-style).
```typescript
interface CitationDetails {
    author?: string;        // e.g. "Mäkinen, Ville"
    published_date?: string; // ISO-8601 Date "2023-01-01"
    publication_name?: string; // e.g. "Nörttitytöt"
    language?: 'fi' | 'en' | 'sv';
}
```

### Reference Types (`reference_type`)
1.  **`official`**: High-trust links.
    *   *Usage:* Official Homepage, Wikidata, RPGGeek entry, Publisher's product page.
    *   *UI:* Prominent buttons or side panel.
2.  **`review`**: Third-party evaluations.
    *   *Usage:* Blog reviews, Podcast episodes, Magazine articles.
    *   *UI:* "Reviews" section with citation formatting.
3.  **`source`**: Used for factual verification if needed (rare for MVP).

### Anti-Patterns
*   **No "Official" overlap:** Do not use this for the publisher's internal ID if it's just a raw FK. This is for *public web links*.
*   **No Dead Links:** Application should ideally validate links periodically (out of scope for MVP).
*   **No user_metadata for Auth:** NEVER use `user_metadata` for admin checks in RLS or application logic. Use `app_metadata`.

### Authorization & Security
- **RLS Policies**: Must strictly check `(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'` for all write operations (`INSERT`, `UPDATE`, `DELETE`).
- **Public Read**: `SELECT` access is granted to all users (`anon` and `authenticated`).

### Code Quality Standards
- **Design Tokens**: Only use tokens from `tokens.css`.
    - Avoid: `--kide-ink-base`, `--kide-snow-white`, `--kide-brand-primary` (deprecated or non-existent).
    - Use: `--kide-ink-primary`, `--kide-surface`, `--kide-ice-deep`.
- **Svelte 5 Patterns**: Use `$props()` instead of `export let`. Use `export const` for props that are not modified.
- **Type Safety**: Avoid `@ts-ignore`. Ensure all filter types match the database schema precisely.

---

## 2. Contract (Quality)

### Definition of Done
- [x] SQL Migration creating `product_references` table with RLS.
- [ ] Zod schema `ProductReferenceSchema` created in `@roolipeli/database`.
- [ ] `citation_details` typed as an optional object in Zod.
- [ ] UI Components for rendering:
    - `ReferenceList.svelte`: Renders the list using design tokens and Svelte 5 patterns.
    - `Citation.svelte`: Renders a single APA-style citation.
- [ ] **Security**: RLS policies verified to use `app_metadata`.
- [ ] **Code Quality**: Biome check passes, no @ts-ignore, all CSS tokens are valid.
- [ ] **Verification**: E2E tests cover rendering and access control.

### Scenarios (Gherkin)

**Scenario: Adding an Official Link**
- Given: I am editing product "Myrskyn Sankarit"
- When: I add a reference with type `official`, label "Wikidata", and URL "..."
- Then: It appears in the "Official Sources" section of the product page

**Scenario: Displaying a Review**
- Given: A product has a `review` reference from "Nörttitytöt"
- When: I view the product page
- Then: I see a section "Reviews" / "Arvostelut"
- And: The link is rendered with the Article Title and Publication Name
