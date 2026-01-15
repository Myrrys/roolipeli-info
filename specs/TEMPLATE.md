# Spec: [Feature Name]

## 1. Blueprint (Design)

### Context
> **Goal:** [What are we building?]  
> **Why:** [Business/user problem being solved]  
> **Architectural Impact:** [What systems does this touch?]

### Data Architecture
- **Schema Changes:** [New tables/columns in Supabase]
- **Validation Rules:** [Zod constraints that must match DB]
- **Relationships:** [Foreign keys, cascades]

### UI Architecture
- **Components:** [New vs. existing from design-system]
- **Routes:** [URL structure, e.g., `/games/[slug]`]
- **Data Flow:** [SSR in Astro → Props to Svelte islands]

### Anti-Patterns
- [What agents must NOT do, with rationale]

---

## 2. Contract (Quality)

### Definition of Done
- [ ] Schema migration applied and typed via `supabase gen types`
- [ ] Zod validators match DB constraints 1:1
- [ ] UI uses only Design Tokens (no hardcoded values)
- [ ] Responsive across breakpoints
- [ ] Accessible (WCAG AA)
- [ ] Unit tests cover validation logic
- [ ] E2E test covers happy path

### Regression Guardrails
- [Invariants that must never break]

### Scenarios (Gherkin)

**Scenario: [Happy Path Name]**
- Given: [User state/precondition]
- When: [Action taken]
- Then: [Expected outcome]

**Scenario: [Error Path Name]**
- Given: [User state/precondition]
- When: [Invalid action]
- Then: [Error handling behavior]
