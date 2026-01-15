# PBI-003: ASDLC Documentation

> **Spec Reference:** `docs/roolipeli-info-scaffolding.md` (Section 9-10)  
> **Persona:** @Architect

---

## 1. The Directive

Create the ASDLC documentation that defines agent personas, operational boundaries, and architectural constraints. These documents govern all future development work.

**In Scope:**
- Create `AGENTS.md` with full content from scaffolding doc Section 9
- Create `CLAUDE.md` symlink pointing to `AGENTS.md`
- Create `ARCHITECTURE.md` with cross-cutting concerns from Section 10
- Templates already exist (created earlier):
  - `specs/TEMPLATE.md`
  - `plans/TEMPLATE.md`

**Out of Scope:**
- Creating actual feature specs (only templates)
- Implementing any code or features
- Modifying existing scaffolding documentation

---

## 2. Context Pointers

- **AGENTS.md Content:** Copy verbatim from `docs/roolipeli-info-scaffolding.md` Section 9
- **ARCHITECTURE.md Content:** Copy verbatim from Section 10
- **Symlink:** `CLAUDE.md` must be a symbolic link for Claude Code compatibility

---

## 3. Verification Pointers

- **Success Criteria:**
  - `AGENTS.md` exists with complete persona definitions
  - `CLAUDE.md` is a symlink to `AGENTS.md`
  - `ARCHITECTURE.md` exists with cross-cutting architectural rules
  - `specs/TEMPLATE.md` exists (already created)
  - `plans/TEMPLATE.md` exists (already created)
  - All files pass Biome formatting check

- **Quality Gate:** `pnpm biome check --write .`

---

## 4. Task Checklist

- [ ] Create `AGENTS.md` with content from scaffolding doc Section 9
- [ ] Create `CLAUDE.md` symlink: `ln -s AGENTS.md CLAUDE.md`
- [ ] Create `ARCHITECTURE.md` with content from Section 10
- [ ] Verify `specs/TEMPLATE.md` exists
- [ ] Verify `plans/TEMPLATE.md` exists
- [ ] Run Biome to format all documentation
- [ ] Verify symlink works: `cat CLAUDE.md` should show AGENTS.md content

---

## 5. Refinement Rule

This PBI has no parent Spec (it's infrastructure). If issues arise:
- [ ] Ensure content matches scaffolding doc exactly
- [ ] Verify symlink creation works on the platform
- [ ] Check file permissions allow symlink creation

---

## 6. Implementation Notes

The templates (specs/TEMPLATE.md and plans/TEMPLATE.md) have already been created earlier in this session. This PBI focuses on creating the three main documentation files that establish ASDLC governance.

**AGENTS.md** defines three personas:
1. @Architect: Systems design and Spec creation
2. @Dev: Implementation following Specs
3. @Librarian: Data accuracy and content entry

**ARCHITECTURE.md** defines:
- Multilingual content model
- SSR-first rendering strategy
- i18n URL patterns
- Semantic web (JSON-LD) requirements
- Security boundaries

---

## 7. Commit Message

```
docs(asdlc): add agent personas and architectural constraints

- Create AGENTS.md with @Architect, @Dev, and @Librarian personas
- Add CLAUDE.md symlink for Claude Code compatibility
- Create ARCHITECTURE.md with cross-cutting system rules
- Templates (specs/TEMPLATE.md, plans/TEMPLATE.md) already in place

Ref: PBI-003
```
