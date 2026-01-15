# PBI-002: Governance & Quality Tooling

> **Spec Reference:** `docs/roolipeli-info-scaffolding.md` (Section 3)  
> **Persona:** @Dev

---

## 1. The Directive

Install and configure the governance tooling that enforces code quality and protects critical packages. This creates the quality gates that all future code must pass through.

**In Scope:**
- Install Biome (replaces ESLint and Prettier)
- Install and configure Lefthook for git hooks
- Install Commitlint for conventional commit enforcement
- Configure pre-commit hooks for:
  - Code formatting (Biome)
  - TypeScript type checking
  - Design System protection guard
- Configure commit-msg hook for Commitlint

**Out of Scope:**
- Running tests (no tests exist yet)
- TypeScript configuration in packages (comes with package setup)
- Creating AGENTS.md or other documentation

---

## 2. Context Pointers

- **Biome Configuration:** Follow `docs/roolipeli-info-scaffolding.md` Section 3.1
- **Lefthook Configuration:** Follow Section 3.2 with Design System guard
- **Commitlint:** Use `@commitlint/config-conventional`
- **Design System Guard:** Critical - prevents unauthorized edits to `packages/design-system/`

---

## 3. Verification Pointers

- **Success Criteria:**
  - Run `pnpm biome check .` → Executes successfully
  - Run `pnpm lefthook install` → Hooks installed in `.git/hooks/`
  - Create test file and attempt commit → Biome auto-formats
  - Attempt to stage `packages/design-system/test.txt` → Hook blocks without `ALLOW_DS_EDIT=true`
  - Commit with invalid message → Commitlint rejects
  - Commit with conventional format → Passes

- **Quality Gate:** Self-enforcing (this PBI creates the gates)

---

## 4. Task Checklist

- [ ] Install dev dependencies: `@biomejs/biome`, `lefthook`, `@commitlint/cli`, `@commitlint/config-conventional`, `typescript`
- [ ] Create `biome.json` with configuration from scaffolding doc
- [ ] Create `lefthook.yml` with:
  - `pre-commit` hooks for biome-check, guard-design-system, type-check
  - `commit-msg` hook for commitlint
- [ ] Create `commitlint.config.js`
- [ ] Run `pnpm lefthook install` to activate hooks
- [ ] Test biome formatting on a sample file
- [ ] Test design system guard (should block)
- [ ] Test commitlint with valid and invalid messages

---

## 5. Refinement Rule

This PBI has no parent Spec (it's infrastructure). If issues arise:
- [ ] Verify Biome version compatibility
- [ ] Ensure Lefthook hooks are executable
- [ ] Check that git hooks directory is writable

---

## 6. Implementation Commands

```bash
# Install governance tooling
pnpm add -D -w @biomejs/biome lefthook @commitlint/cli @commitlint/config-conventional typescript

# Create biome.json (see scaffolding doc Section 3.1 for full content)

# Create lefthook.yml (see scaffolding doc Section 3.2 for full content)

# Create commitlint.config.js
cat > commitlint.config.js <<'EOF'
module.exports = { extends: ['@commitlint/config-conventional'] };
EOF

# Install lefthook hooks
pnpm lefthook install

# Verify biome
pnpm biome check --write .

# Test design system guard
mkdir -p packages/design-system
echo "test" > packages/design-system/test.txt
git add packages/design-system/test.txt
git commit -m "test: verify guard" # Should fail
rm packages/design-system/test.txt
```

---

## 7. Commit Message

```
feat(governance): configure biome, lefthook, and commitlint

- Add Biome as unified linter/formatter (replaces ESLint/Prettier)
- Configure Lefthook with pre-commit hooks for formatting and type-checking
- Add Design System protection guard (requires ALLOW_DS_EDIT=true)
- Configure Commitlint for conventional commit enforcement

Ref: PBI-002
```
