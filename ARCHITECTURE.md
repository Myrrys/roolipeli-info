# ARCHITECTURE.md - Roolipeli.info System Rules

> This document defines cross-cutting architectural decisions that apply across all features.
> Feature-specific rules belong in `specs/{feature}/spec.md`.

---

## 1. Data Architecture

### Multilingual Content Model

All user-facing text fields follow the pattern:
- `title` (required, Finnish default)
- `title_fi` (Finnish, may alias `title`)
- `title_sv` (Swedish, optional)
- `title_en` (English, optional)

### Row-Level Security (RLS)

All Supabase tables MUST have RLS enabled. Public read access is granted via policies, 
not by disabling RLS.

### Schema-Validation Parity

Every Supabase table constraint MUST have a matching Zod validator in `@roolipeli/database`. 
If they diverge, the database is the source of truth and Zod must be updated.

---

## 2. Rendering Architecture

### SSR-First Strategy

- **Astro:** All data fetching happens in server frontmatter
- **Svelte Islands:** Receive pre-fetched data as props, hydrate for interactivity
- **No Client Fetching:** Svelte components never call `fetch()` directly

### Hydration Rules

| Directive | Use Case |
|-----------|----------|
| `client:load` | Interactive components needed immediately |
| `client:idle` | Below-fold interactivity |
| `client:visible` | Lazy-loaded content |
| (none) | Static content, no JS shipped |

---

## 3. i18n Architecture

### URL Strategy

| Locale | URL Pattern | Notes |
|--------|-------------|-------|
| Finnish (default) | `/games/...` | No prefix |
| Swedish | `/sv/games/...` | Prefix |
| English | `/en/games/...` | Prefix |

### Content Fallback

If translated content is missing, fall back to Finnish, never show empty.

---

## 4. Semantic Web (JSON-LD)

### Required Schema.org Types

- `Game` → `schema:Game` or `schema:Product`
- `Creator` → `schema:Person` or `schema:Organization`
- `Publisher` → `schema:Organization`

### Implementation

Every public page MUST include a `<script type="application/ld+json">` block 
with appropriate structured data for Answer Engine Optimization.

---

## 5. Security Boundaries

### Environment Variables

| Variable | Location | Exposure |
|----------|----------|----------|
| `SUPABASE_URL` | `.env` | Server only |
| `SUPABASE_ANON_KEY` | `.env` | Server only (SSR) |
| `PUBLIC_*` | `.env` | Client safe |

### API Routes

All `/api/*` routes validate input with Zod before processing.
All mutations require authentication (future).
