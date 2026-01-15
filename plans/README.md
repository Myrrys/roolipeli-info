# Roolipeli.info PBI Execution Guide

This directory contains Product Backlog Items (PBIs) for scaffolding the roolipeli-info monorepo following ASDLC principles.

## Execution Order

The PBIs must be executed **sequentially** in the following order:

1. **PBI-001**: Monorepo & Workspace Initialization
2. **PBI-002**: Governance & Quality Tooling
3. **PBI-003**: ASDLC Documentation
4. **PBI-006**: Config Package *(moved up - no dependencies)*
5. **PBI-004**: Database Package
6. **PBI-005**: Design System Package
7. **PBI-007**: Main Site App
8. **PBI-008**: Design System Documentation App
9. **PBI-009**: Testing Infrastructure

## Execution Workflow

For each PBI:

1. **Read the PBI** - Understand scope, context, and success criteria
2. **Execute tasks** - Follow the task checklist in order
3. **Verify success** - Check all success criteria pass
4. **Run quality gates** - Ensure Biome formatting and type checking pass
5. **Commit** - Use the provided commit message template
6. **Move to next PBI** - Only proceed after current PBI is complete

## Special Notes

### PBI-002: Governance Tooling
After this PBI, all commits must follow conventional commit format and pass Biome checks.

### PBI-005: Design System Package
This PBI creates a PROTECTED package. All future commits to `packages/design-system/` require:
```bash
ALLOW_DS_EDIT=true git commit -m "..."
```

### PBI-007 & PBI-008: Astro Apps
Both apps need dev servers running on different ports. The main-site uses port 4321 by default.

### PBI-009: Testing Infrastructure
Requires Playwright browsers to be installed. Run `pnpm exec playwright install` after installing dependencies.

## Progress Tracking

- [ ] PBI-001: Monorepo Initialization
- [ ] PBI-002: Governance Tooling
- [ ] PBI-003: ASDLC Documentation
- [ ] PBI-006: Config Package
- [ ] PBI-004: Database Package
- [ ] PBI-005: Design System Package
- [ ] PBI-007: Main Site App
- [ ] PBI-008: Design Docs App
- [ ] PBI-009: Testing Infrastructure

## Post-Scaffolding

After all PBIs are complete, run the verification strategy from the main plan:
- Workspace verification
- Governance verification
- App verification
- Testing verification
- Documentation verification

See `/Users/ville.takanen/.claude/plans/concurrent-beaming-peacock.md` for the full verification checklist.

## Next Steps After Scaffolding

Once scaffolding is complete, the project will be ready for feature development:

1. Create first feature spec: `specs/game-catalog/spec.md`
2. Design database schema (games, creators, publishers)
3. Connect to Supabase and generate types
4. Build first UI components

---

**Reference:** See `docs/roolipeli-info-scaffolding.md` for the complete scaffolding specification.
