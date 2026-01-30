# Spec: Semantic Labels (ROO-10)

## 1. Blueprint (Design)

### Context
> **Goal:** Introduce a formalized system for describing products with semantic labels (e.g., "Adventure", "OSR", "Sci-Fi") that map to external LOD (Linked Open Data) vocabularies like Wikidata.
> **Why:** Currently, product types are hardcoded enums or free text. To improve SEO and enable richer JSON-LD structured data, we need labels that carry semantic meaning (URIs) rather than just string values.
> **Architectural Impact:** Addition of `semantic_labels` table and relationships in `database` package; Admin UI updates to manage these; Frontend updates to render tags and generate JSON-LD.

### Data Architecture

#### Schema Changes

**New Table: `semantic_labels`**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `label` | text | Display name (e.g., "Seikkailu") |
| `wikidata_id` | text | Wikidata ID (e.g., "Q4686479") |
| `description` | text | Optional internal description |
| `created_at` | timestamptz | |

**New Join Table: `product_semantic_labels`**
| Column | Type | Description |
|--------|------|-------------|
| `product_id` | UUID (FK) | Reference to `products.id` |
| `label_id` | UUID (FK) | Reference to `semantic_labels.id` |
| `idx` | integer | Order index (for prioritizing main labels) |

#### Relationships
- `products` 1:N `product_semantic_labels` N:1 `semantic_labels`
- Cascade delete on product removal.

### UI Architecture

#### Admin UI (`/admin/labels`)
- **CRUD for Labels:** List, Create, Edit, Delete semantic labels.
- **Wikidata Lookup:** (Nice to have) Input Wikidata ID and fetch label automatically? Or just manual entry for MVP.

#### Admin UI (`/admin/products/[id]`)
- **Label Assignment:** Multi-select or combobox to assign existing labels to a product.
- **Quick Add:** Ability to create a new label inline (as requested in ROO-10 description).

#### Frontend (`/tuotteet/[slug]`)
- **Visuals:** Display labels as standard Kide tags (`.tag`).
- **Structured Data:** Inject `about` or `genre` properties into the product's JSON-LD script using the Wikidata URIs (e.g., `http://www.wikidata.org/entity/Q4686479`).

---

## 2. Contract (Quality)

### Definition of Done for Admin
- [ ] Migration created and applied.
- [ ] Zod schemas exported from `@roolipeli/database`.
- [ ] Admin user can creates/edit `semantic_labels` (requires label + wikidata_id).
- [ ] Admin user can assign multiple labels to a product.

### Definition of Done for Consumer (Main Site)
- [ ] Product page displays assigned semantic labels as tags.
- [ ] Product page HEAD includes JSON-LD with semantic links.

### Scenarios

**Scenario: Adding a label with Wikidata ID**
- Given: I am an admin editing a product "Myrrys"
- When: I add a label "Fantasy" with Wikidata ID "Q123"
- Then: The product page for "Myrrys" contains a JSON-LD block with `about: "http://www.wikidata.org/entity/Q123"`

**Scenario: Ensuring Semantic Validity**
- Given: I am creating a new label
- When: I try to save without a Wikidata ID
- Then: The system warns that a semantic link is required (or strongly recommended).
