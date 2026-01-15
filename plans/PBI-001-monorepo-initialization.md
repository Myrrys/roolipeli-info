# PBI-001: Monorepo & Workspace Initialization

> **Spec Reference:** `docs/roolipeli-info-scaffolding.md` (Section 1-2)  
> **Persona:** @Dev

---

## 1. The Directive

Initialize the monorepo workspace structure and configure pnpm workspaces. This is the foundation upon which all other scaffolding work depends.

**In Scope:**
- Create directory structure: `apps/`, `packages/`, `specs/`, `plans/`
- Initialize root `package.json` with workspace metadata
- Create `pnpm-workspace.yaml` defining workspace patterns
- Verify pnpm installation and workspace functionality

**Out of Scope:**
- Installing development dependencies (comes in PBI-002)
- Creating package-specific configurations
- Setting up git hooks or linting tools

---

## 2. Context Pointers

- **Directory Structure:** Follow exact structure from `docs/roolipeli-info-scaffolding.md` Section 1
- **Workspace Configuration:** Use pnpm workspaces with patterns `apps/*` and `packages/*`
- **Package Manager:** Exclusively use pnpm (no npm or yarn)

---

## 3. Verification Pointers

- **Success Criteria:**
  - Run `pnpm --version` → Returns version (verify pnpm is available)
  - Directory structure matches: `apps/`, `packages/`, `specs/`, `plans/` exist
  - Run `pnpm install` from root → Executes without errors
  - `pnpm-workspace.yaml` correctly defines workspace packages

- **Quality Gate:** No quality gates yet (tooling comes in PBI-002)

---

## 4. Task Checklist

- [ ] Verify pnpm is installed (or install if needed)
- [ ] Create directory structure: `apps/`, `packages/`, `specs/`, `plans/`
- [ ] Initialize root `package.json` with:
  - Name: `roolipeli-info`
  - Private: `true`
  - Type: `module`
  - Scripts placeholder for future use
- [ ] Create `pnpm-workspace.yaml` with patterns:
  - `apps/*`
  - `packages/*`
- [ ] Run `pnpm install` to verify workspace setup
- [ ] Verify all directories exist and workspace is functional

---

## 5. Refinement Rule

This PBI has no parent Spec (it's infrastructure). If issues arise:
- [ ] Check pnpm documentation for workspace setup
- [ ] Ensure directory names match scaffolding doc exactly
- [ ] Flag any pnpm version incompatibilities

---

## 6. Implementation Commands

```bash
# Verify/install pnpm
which pnpm || npm install -g pnpm

# Create directory structure
mkdir -p apps packages specs plans

# Initialize root package.json (or create manually)
cat > package.json <<'EOF'
{
  "name": "roolipeli-info",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "echo 'No apps configured yet'",
    "build": "echo 'No apps configured yet'",
    "test": "echo 'No tests configured yet'"
  }
}
EOF

# Create workspace configuration
cat > pnpm-workspace.yaml <<'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# Verify setup
pnpm install
```

---

## 7. Commit Message

```
feat(workspace): initialize monorepo structure

- Create apps/, packages/, specs/, plans/ directories
- Configure pnpm workspace with apps/* and packages/* patterns
- Initialize root package.json with workspace metadata

Ref: PBI-001
```
