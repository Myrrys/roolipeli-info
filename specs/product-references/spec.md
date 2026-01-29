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

---

## 2. Contract (Quality)

### Definition of Done
- [ ] SQL Migration creating `product_references` table with RLS.
- [ ] Zod schema `ProductReferenceSchema` created in `@roolipeli/database`.
- [ ] `citation_details` typed as an optional object in Zod.
- [ ] UI Components for rendering:
    - `ReferenceList.svelte`: Renders the list.
    - `Citation.svelte`: Renders a single APA-style citation.

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
