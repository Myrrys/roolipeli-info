# MVP Roadmap: Roolipeli.info

**Status:** DRAFT  
**Date:** 2026-01-18  
**Author:** @Architect (Antigravity)

---

## 1. Executive Summary

The project `roolipeli-info` has successfully completed its scaffolding phase (PBIs 001-009). The infrastructure is robust, enforcing ASDLC principles via `AGENTS.md`, `specs/`, and `plans/`.

We are now entering the **MVP Phase**, with the goal of launching the **Game Catalog** — the core value proposition of the knowledge base. This roadmap outlines the steps to move from an empty shell to a populated, visible, and searchable database of Finnish RPGs.

## 2. Current State Assessment (ASDLC Audit)

| Component | Status | ASDLC Alignment | Notes |
|-----------|--------|-----------------|-------|
| **Infrastructure** | ✅ Ready | ⭐ High | Monorepo, SSR, pnpm, Biome, Lefthook all active. |
| **Governance** | ✅ Ready | ⭐ High | `AGENTS.md` defines roles. `ALLOW_DS_EDIT` protects Design System. |
| **Data Layer** | 🚧 Pending | ⚠️ Medium | Supabase types generated, but no live connection or schema logic yet. |
| **Design System** | 🔄 In Progress | ⭐ High | PBI-010 is implementing "Kide" aesthetic. Tokens & Components structure is solid. |
| **Features** | ❌ None | N/A | No user-facing features exist beyond landing page. |
| **Testing** | ⚠️ Skeleton | ⚠️ Low | Test runners work, but suites are empty (`passWithNoTests`). |

---

## 3. Strategic Objectives (The "Allow" List)

1.  **Establish the Source of Truth**: Connect Supabase and define the strict schema for `Game`, `Publisher`, and `Creator`.
2.  **Display the Catalog**: Create a read-only view of the data (Index + Detail pages).
3.  **Enable Data Entry**: Create a "Librarian" workflow (likely admin scripts or a basic admin UI) to populate the initial dataset.
4.  **Polish the Vibe**: Ensure the "Kide" design system is fully applied and responsive.

---

## 4. Phase Breakdown

## 4. Phase Breakdown

### v0.2.0: The Data Foundation (Rudimentary CRUD)
*Status: NEXT UP*

**Objective:** Enable the `@Librarian` to creating, reading, updating, and deleting the core entities: `Publisher`, `Creator`, and `Product` (Game).

#### Required Specifications (The State)

1.  **`specs/database/spec.md` (The Data Contract)**
    *   **Purpose:** Defines the Source of Truth.
    *   **Content:**
        *   Schema definitions for `publishers`, `creators`, `products`.
        *   Row-Level Security (RLS) policies (Admin read/write, Public read-only).
        *   Zod validation schemas that mirror Postgres constraints.
        *   Foreign key relationships (Product -> Publisher, Product -> Creator(s)).

2.  **`specs/admin-tools/spec.md` (The Librarian's Interface)**
    *   **Purpose:** Defines *how* we interact with the data (CRUD).
    *   **Content:**
        *   **Auth:** Basic mechanism for Admin identification (Supabase Auth).
        *   **Ingestion Strategy:** For v0.2.0, likely "Seed Scripts" or a "CLI Tool" rather than a full UI to save time, OR a very raw "Admin Tray" in the UI.
            *   *Recommendation for MVP:* Use **Structured Seed Files (JSON)** + **Ingest Script**. This avoids building complex forms and UI state management for now.
        *   **Validation:** How we ensure data quality before hitting the DB.

#### Execution Plan (The PBIs)

1.  **PBI-011: Supabase Initialization & Connection**
    *   Create Supabase project.
    *   Add connection strings to `.env`.
    *   Setup `supabase` CLI in the repo.

2.  **PBI-012: Core Schema Implementation**
    *   Based on `specs/database/spec.md`.
    *   Write migrations (SQL).
    *   Run `supabase gen types`.
    *   Implement Zod schemas in `packages/database`.

3.  **PBI-013: The Ingestion Engine (CRUD v1)**
    *   Based on `specs/admin-tools/spec.md`.
    *   Create `scripts/seed` or `apps/admin-cli`.
    *   Demonstrate ability to Insert/Update a Product via script.

---

### v0.3.0: Public Catalog (Read-Only)
*Status: NEXT*

**Objective:** Get the data visible to users immediately. No auth, just browsing.

1.  **PBI-014: Database Query Layer**
    *   Implement `getProducts()`, `getPublishers()`, `getCreators()` in `packages/database`.
    *   Implement detail queries: `getProductBySlug()`, etc.

2.  **PBI-015: Public Routes & UI**
    *   Create `/products`, `/publishers`, `/creators` listing pages.
    *   Create `/products/[slug]`, `/publishers/[slug]`, `/creators/[slug]` detail pages.
    *   Build `ProductCard`, `PublisherCard`, `CreatorCard` components.

---

### v0.4.0: Admin CRUD Interface
*Status: PLANNED*

**Objective:** Enable the `@Librarian` to edit data via a web UI.

1.  **PBI-016: Supabase Auth Setup**
    *   Implement email/password authentication.
    *   Update RLS policies to allow writes for `authenticated` role.

2.  **PBI-017: Admin Web Interface**
    *   Create `/admin/products`, `/admin/publishers`, `/admin/creators` with CRUD forms.
    *   Implement create, update, delete operations.

---

## 5. Next Immediate Steps (The Plan)

1.  **Finish PBI-010**: Don't leave the Design System half-baked. (**Current**)
2.  **Create PBI-011 (Supabase Setup)**: Link the project, set up formatting.
3.  **Create PBI-012 (Game Schema)**: Define the core tables and Zod schemas.
4.  **Create `specs/game-catalog/spec.md`**: The blueprints for the first feature.

## 6. Risk Assessment

*   **Content Bottleneck**: We have no data. We need a "Content Strategy" parallel track.
*   **Complexity Creep**: Avoid "Auth" complexity early on. Use seed scripts for admin work initially.
*   **Design Drift**: Ensure PBI-010 is strict about not hardcoding hex values.

---

**Approval Required:**
- [ ] @Architect (Structure)
- [ ] @Librarian (Data Model)
