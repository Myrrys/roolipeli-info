# PBI: [Task Name]

> **Spec Reference:** `specs/{feature-domain}/spec.md`  
> **Persona:** @Dev (or @Architect, @Librarian)

---

## 1. The Directive

[Strict instruction on what to build RIGHT NOW. Include explicit scope boundaries.]

**In Scope:**
- [What this PBI delivers]

**Out of Scope:**
- [What this PBI does NOT touch]

---

## 2. Context Pointers

- **Data Constraints:** Follow `Data Architecture` section in Spec
- **UI Constraints:** Follow `UI Architecture` section in Spec
- **Styling:** Use only `@roolipeli/design-system` tokens

---

## 3. Verification Pointers

- **Success Criteria:** Pass Scenario "[Name]" in Spec
- **Quality Gate:** `pnpm vitest run && pnpm tsc --noEmit`

---

## 4. Task Checklist

- [ ] Task A
- [ ] Task B
- [ ] Update Spec if contracts changed (same commit)

---

## 5. Refinement Rule

If reality diverges from the Spec:
- [ ] STOP and flag for @Architect review
- [ ] Document the divergence in this PBI
- [ ] Do NOT update Spec without explicit approval
