# Task: v0.2.0 Development Phase

## PBI-011: Supabase Initialization & Connection (Done)
- [x] Install Supabase CLI as devDependency
- [x] Initialize Supabase in the repository (`supabase init`)
- [x] Create `.env.example` with Supabase placeholders
- [x] Add database helper scripts to root `package.json`
- [x] Log in to Supabase CLI (`supabase login`)
- [x] Link to remote project (`supabase link`)
- [x] Verify connection to remote dev

## PBI-013: The Ingestion Engine (Done)
- [x] Create implementation plan for ingestion engine
- [x] Create seed data files (`data/*.json`)
- [x] Implement `scripts/ingest.ts`
- [x] Add `pnpm ingest` script to `package.json`
- [x] Verify ingestion to remote project

## PBI-012: Core Schema Implementation (Done)
- [x] Create implementation plan for core entities
- [x] Create SQL migration for `publishers`, `creators`, `products`
- [x] Implement RLS Policies (Public Read)
- [x] Implement Zod schemas in `packages/database`
- [x] Export and verify types
