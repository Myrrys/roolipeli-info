# Completed: v0.2.0 Phase (Data Foundation & Public Catalog)

## PBI-011: Supabase Initialization
- [x] Create Supabase project
- [x] Add connection strings to environment
- [x] Setup Supabase client in packages/database

## PBI-012: Core Schema Implementation
- [x] Write migration for core tables (publishers, creators, products, products_creators)
- [x] Generate TypeScript types from Supabase
- [x] Implement RLS policies (public read, admin write)

## PBI-013: The Ingestion Engine
- [x] Create seed migration with real data (Velhon torni)
- [x] Seed includes publisher, 8 creators, 3 products

## PBI-014: Database Query Layer
- [x] Implement `getProducts()` in `packages/database`
- [x] Implement `getProductBySlug()` in `packages/database`
- [x] Implement `getPublishers()` in `packages/database`
- [x] Implement `getPublishers()` in `packages/database`
- [x] Implement `getCreators()` in `packages/database`
- [x] Export all queries from package index
- [x] Add unit tests for query layer (9 tests)

## PBI-015: Public Routes & UI
- [x] Create `/products` listing page
- [x] Create `/products/[slug]` detail page
- [x] Create `/publishers` listing page
- [x] Create `/creators` listing page
- [x] Build ProductCard component (Svelte 5)
- [x] Add E2E tests for all routes (19 tests)

## Documentation & Testing
- [x] Write comprehensive spec: `specs/product-catalog/spec.md`
- [x] Document technical debt and future work
- [x] All tests passing (22 E2E + 9 unit tests)
- [x] Biome compliance with Svelte 5 support

---

# Next: v0.3.0 Phase
- [ ] TBD: Admin CRUD Interface or Additional Features
